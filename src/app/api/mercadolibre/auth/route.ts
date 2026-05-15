/**
 * GET /api/mercadolibre/auth
 * Genera la URL de autorización OAuth2 de ML y redirige al usuario.
 *
 * El `state` es el dealershipId encriptado en base64 — ML lo devuelve intacto
 * en el callback para que podamos identificar a qué tenant pertenece el código.
 */
import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { getCurrentDealership } from "@/lib/auth";
import { buildAuthUrl } from "@/lib/mercadolibre/client";

export const GET = withLogger(async (_request, _ctx) => {
  const dealership = await getCurrentDealership();
  if (!dealership) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // state = dealershipId en base64 (simple, no necesita firma para este caso de uso)
  const state = Buffer.from(dealership.id).toString("base64url");

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
