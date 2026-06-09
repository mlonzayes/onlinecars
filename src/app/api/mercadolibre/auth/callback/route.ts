/**
 * GET /api/mercadolibre/auth/callback
 * Callback OAuth2 de Mercado Libre.
 *
 * Recibe: ?code=...&state=...
 *
 * Verificaciones (en orden — defense in depth):
 *  1) verifyState(state): firma HMAC válida + no expirado (TTL 10min)
 *  2) auth(): user de Clerk autenticado
 *  3) membership: el user es miembro del dealership decodificado del state
 *  4) plan gating: el dealer todavía permite ML
 *
 * Sin (2) y (3) un atacante podría forjar un state apuntando a otro tenant
 * y dejar SUS tokens de ML asociados al dealer víctima ("ML account hijack").
 *
 * Después: intercambia code → tokens, los guarda encriptados, redirige al
 * dashboard.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getPlanLimits } from "@/lib/plans";
import { exchangeCode, getMLUserInfo } from "@/lib/mercadolibre/client";
import { saveTokens } from "@/lib/mercadolibre/token-store";
import { verifyState } from "@/lib/mercadolibre/oauth-state";

export const GET = withLogger(async (request, { requestId }) => {
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

  const stateResult = verifyState(state);
  if (!stateResult.ok) {
    logger.warn(requestId, "ml.callback.invalid_state", { reason: stateResult.reason });
    return NextResponse.redirect(
      `${appUrl}/dashboard/portales?ml_error=invalid_state`
    );
  }
  const dealershipId = stateResult.dealershipId;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", request.url).toString());
  }

  const membership = await prisma.dealershipUser.findFirst({
    where: { clerkUserId: userId, dealershipId },
    select: { id: true },
  });

  if (!membership) {
    logger.warn(requestId, "ml.callback.dealership_mismatch", {
      userId, dealershipId,
    });
    return NextResponse.redirect(
      `${appUrl}/dashboard/portales?ml_error=invalid_state`
    );
  }

  // Plan gating — re-verificamos acá. Si el plan cambió entre el start y el
  // callback (downgrade durante el flow), no permitimos completar la conexión.
  const dealership = await prisma.dealership.findUnique({
    where: { id: dealershipId },
    select: { id: true, plan: true },
  });
  if (!dealership) {
    return NextResponse.redirect(`${appUrl}/dashboard/portales?ml_error=invalid_state`);
  }
  if (!getPlanLimits(dealership).allowMLIntegration) {
    logger.warn(requestId, "ml.callback.plan_gated", {
      dealershipId,
      plan: dealership.plan,
    });
    return NextResponse.redirect(
      `${appUrl}/dashboard/portales?ml_error=${encodeURIComponent("Mercado Libre está disponible a partir del plan Media.")}`
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
