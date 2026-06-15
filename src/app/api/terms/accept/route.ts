/**
 * POST /api/terms/accept
 * Registra que el usuario autenticado aceptó la versión legal vigente.
 * Idempotente (no duplica si ya aceptó esa versión). Lo consume la página
 * /aceptar-terminos y el flujo de re-aceptación.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { recordTermsAcceptance } from "@/lib/legal";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";

export const POST = withLogger(async (_request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Contexto opcional: el dealership desde el que acepta (si tiene uno).
  const dealership = await getCurrentDealership();
  await recordTermsAcceptance(userId, dealership?.id ?? null);

  logger.info(requestId, "terms.accepted", { userId, dealershipId: dealership?.id ?? null });

  return NextResponse.json({ data: { ok: true } });
});
