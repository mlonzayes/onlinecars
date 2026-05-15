/**
 * POST /api/mercadolibre/webhooks
 * Recibe notificaciones de Mercado Libre y las procesa según el topic.
 *
 * Topics manejados:
 * - "questions" → crea un Lead con source="mercadolibre"
 *
 * Seguridad:
 * - ML firma las notificaciones con HMAC-SHA256 (header x-signature)
 * - Verificamos la firma antes de procesar
 * - Respondemos 200 siempre (ML reintenta si no recibe 200)
 *
 * Docs: https://developers.mercadolibre.com.ar/es_ar/recibe-notificaciones
 */
import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getQuestion } from "@/lib/mercadolibre/client";
import type { MLWebhookNotification } from "@/lib/mercadolibre/types";

function verifyMLSignature(request: Request, body: string): boolean {
  const secret = process.env.ML_WEBHOOK_SECRET;
  if (!secret) {
    // Si no hay secret configurado, pasamos (entorno de desarrollo)
    return true;
  }

  const signature = request.headers.get("x-signature");
  if (!signature) return false;

  // El header tiene formato: ts=...,v1=...
  const parts = Object.fromEntries(
    signature.split(",").map((p) => p.split("=") as [string, string])
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const xRequestId = request.headers.get("x-request-id") ?? "";
  const manifest = `id:${xRequestId};request-id:${xRequestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  return expected === v1;
}

export const POST = withLogger(async (request, { requestId }) => {
  const rawBody = await request.text();

  // Verificar firma HMAC
  if (!verifyMLSignature(request, rawBody)) {
    logger.warn(requestId, "ml.webhook.invalid_signature", {});
    // Respondemos 200 para que ML no reintente — pero no procesamos
    return NextResponse.json({ ok: false, reason: "invalid_signature" });
  }

  let notification: MLWebhookNotification;
  try {
    notification = JSON.parse(rawBody);
  } catch {
    logger.warn(requestId, "ml.webhook.invalid_json", {});
    return NextResponse.json({ ok: false, reason: "invalid_json" });
  }

  logger.info(requestId, "ml.webhook.received", {
    topic: notification.topic,
    resource: notification.resource,
    userId: notification.user_id,
  });

  // Solo procesamos preguntas por ahora
  if (notification.topic !== "questions") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    await handleQuestion(notification, requestId);
  } catch (err) {
    // Log pero respondemos 200 — ML reintentará si recibe 4xx/5xx
    logger.error(requestId, "ml.webhook.question_error", {
      error: err instanceof Error ? err.message : String(err),
      resource: notification.resource,
    });
  }

  return NextResponse.json({ ok: true });
});

async function handleQuestion(
  notification: MLWebhookNotification,
  requestId: string
): Promise<void> {
  // resource = "/questions/123456789"
  const questionId = notification.resource.split("/").pop();
  if (!questionId) return;

  // Encontrar a qué concesionario pertenece este mlUserId
  const mlAccount = await prisma.mercadoLibreAccount.findFirst({
    where: { mlUserId: String(notification.user_id) },
    include: { dealership: true },
  });

  if (!mlAccount) {
    // La notificación es de un user_id que no tenemos registrado — ignorar
    return;
  }

  // Obtener detalles de la pregunta desde ML
  const question = await getQuestion(mlAccount.dealershipId, questionId);

  // Buscar a qué vehículo local corresponde el item de ML
  const listing = await prisma.mercadoLibreListing.findFirst({
    where: {
      mlItemId: question.item_id,
      dealershipId: mlAccount.dealershipId,
    },
  });

  // Crear el lead
  const lead = await prisma.lead.create({
    data: {
      dealershipId: mlAccount.dealershipId,
      vehicleId: listing?.vehicleId ?? null,
      name: `Pregunta ML #${question.id}`,
      message: question.text,
      source: "mercadolibre",
      status: "new",
    },
  });

  logger.info(requestId, "ml.webhook.lead_created", {
    dealershipId: mlAccount.dealershipId,
    leadId: lead.id,
    questionId,
    mlItemId: question.item_id,
    vehicleId: listing?.vehicleId ?? null,
  });
}
