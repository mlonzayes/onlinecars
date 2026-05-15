/**
 * GET /api/mercadolibre/auth/callback
 * Callback OAuth2 de Mercado Libre.
 *
 * Recibe: ?code=...&state=...
 * - Intercambia el code por access + refresh tokens
 * - Obtiene el nickname del vendedor
 * - Guarda los tokens encriptados en DB
 * - Redirige al dashboard de configuración
 */
import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { exchangeCode, getMLUserInfo } from "@/lib/mercadolibre/client";
import { saveTokens } from "@/lib/mercadolibre/token-store";

export const GET = withLogger(async (request, _ctx) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  // ML puede devolver error si el usuario cancela la autorización
  if (error) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/portales?ml_error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/portales?ml_error=missing_params`
    );
  }

  // Decodificar dealershipId del state
  let dealershipId: string;
  try {
    dealershipId = Buffer.from(state, "base64url").toString("utf8");
  } catch {
    return NextResponse.redirect(
      `${appUrl}/dashboard/portales?ml_error=invalid_state`
    );
  }

  try {
    const redirectUri = `${appUrl}/api/mercadolibre/auth/callback`;

    // Intercambiar código por tokens
    const tokenResponse = await exchangeCode(code, redirectUri);

    // Obtener nickname del vendedor usando el access token recién obtenido
    // Temporalmente guardamos los tokens para poder hacer la call a /users/me
    await saveTokens(dealershipId, tokenResponse, "");

    const userInfo = await getMLUserInfo(dealershipId);

    // Actualizar con el nickname real
    await saveTokens(dealershipId, tokenResponse, userInfo.nickname);

    return NextResponse.redirect(
      `${appUrl}/dashboard/portales?ml_connected=1`
    );
  } catch (err) {
    console.error("[ML_CALLBACK_ERROR]", err instanceof Error ? err.message : err);
    return NextResponse.redirect(
      `${appUrl}/dashboard/portales?ml_error=${encodeURIComponent("No se pudo conectar con Mercado Libre en este momento.")}`
    );
  }
});
