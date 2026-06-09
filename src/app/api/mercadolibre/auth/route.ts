/**
 * GET /api/mercadolibre/auth
 * Genera la URL de autorización OAuth2 de ML y redirige al usuario.
 *
 * El `state` es un token FIRMADO (HMAC-SHA256) que contiene el dealershipId +
 * timestamp. ML lo devuelve intacto en el callback. Antes era solo
 * `base64(dealershipId)` — vulnerable a forge ("ML account hijack"). Ahora el
 * callback verifica firma + TTL + membership del user, ver verifyState en
 * src/lib/mercadolibre/oauth-state.ts.
 */
import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { getCurrentDealership } from "@/lib/auth";
import { buildAuthUrl } from "@/lib/mercadolibre/client";
import { getPlanLimits } from "@/lib/plans";
import { signState } from "@/lib/mercadolibre/oauth-state";

export const GET = withLogger(async (_request, { requestId }) => {
  const dealership = await getCurrentDealership();
  if (!dealership) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Plan gating — defense in depth. La UI ya muestra "Mejorá tu plan" pero el
  // endpoint no debe iniciar el OAuth si el plan no permite ML.
  if (!getPlanLimits(dealership).allowMLIntegration) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    logger.warn(requestId, "ml.auth.plan_gated", {
      dealershipId: dealership.id,
      plan: dealership.plan,
    });
    return NextResponse.redirect(
      `${appUrl}/dashboard/portales?ml_error=${encodeURIComponent("Mercado Libre está disponible a partir del plan Media.")}`
    );
  }

  const state = signState(dealership.id);

  try {
    const authUrl = buildAuthUrl(state);
    return NextResponse.redirect(authUrl);
  } catch (err) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    // Logueamos el error real en la consola/sistema de logs, pero no lo exponemos al cliente.
    console.error("[ML_AUTH_ERROR]", err instanceof Error ? err.message : err);
    
    return NextResponse.redirect(
      `${appUrl}/dashboard/portales?ml_error=${encodeURIComponent("El servicio no está configurado correctamente. Contactá a soporte.")}`
    );
  }
});
