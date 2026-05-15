/**
 * GET /api/mercadolibre/status
 * Devuelve el estado de la cuenta ML del concesionario autenticado.
 *
 * DELETE /api/mercadolibre/status
 * Desconecta la cuenta ML (borra tokens y listings de la DB).
 */
import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { getCurrentDealership } from "@/lib/auth";
import { getAccountInfo, deleteAccount } from "@/lib/mercadolibre/token-store";

export const GET = withLogger(async (_request, _ctx) => {
  const dealership = await getCurrentDealership();
  if (!dealership) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const account = await getAccountInfo(dealership.id);

  if (!account) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    nickname: account.nickname,
    mlUserId: account.mlUserId,
    connectedAt: account.createdAt,
    // Indicamos si el token está cerca de vencer (útil para la UI)
    tokenExpiresSoon: account.expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000,
  });
});

export const DELETE = withLogger(async (_request, _ctx) => {
  const dealership = await getCurrentDealership();
  if (!dealership) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const account = await getAccountInfo(dealership.id);
  if (!account) {
    return NextResponse.json({ error: "No hay cuenta ML conectada" }, { status: 404 });
  }

  await deleteAccount(dealership.id);

  return NextResponse.json({ disconnected: true });
});
