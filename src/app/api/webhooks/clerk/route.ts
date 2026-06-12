import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";
import { logger, generateRequestId } from "@/lib/logger";
import { sendTelegramNotification, escapeTelegramHTML } from "@/lib/telegram";

// POST /api/webhooks/clerk
// Recibe eventos de Clerk vía Svix. Verifica la firma antes de procesar.
// Requiere: CLERK_WEBHOOK_SECRET en env.
//
// Eventos manejados:
//   user.deleted  → elimina DealershipUser del usuario (y DealershipInvite por email si aplica)
//
// Nota: no usamos withLogger acá porque el body tiene que leerse como raw text
// para que la verificación de firma de Svix funcione. withLogger hace req.json() internamente.

export async function POST(req: Request) {
  const requestId = generateRequestId();

  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    logger.error(requestId, "webhook.clerk.missing_secret");
    return NextResponse.json({ error: "Webhook secret no configurado" }, { status: 500 });
  }

  // Svix requiere el body como string para verificar la firma
  const body = await req.text();
  const svixId = req.headers.get("svix-id") ?? "";
  const svixTimestamp = req.headers.get("svix-timestamp") ?? "";
  const svixSignature = req.headers.get("svix-signature") ?? "";

  if (!svixId || !svixTimestamp || !svixSignature) {
    logger.warn(requestId, "webhook.clerk.missing_svix_headers");
    return NextResponse.json({ error: "Headers de Svix faltantes" }, { status: 400 });
  }

  const wh = new Webhook(secret);
  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    logger.warn(requestId, "webhook.clerk.invalid_signature", { svixId });
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  logger.info(requestId, "webhook.clerk.received", { type: event.type, svixId });

  if (event.type === "user.created") {
    const { id, email_addresses, first_name, last_name } = event.data;
    const email = email_addresses?.[0]?.email_address ?? "sin email";
    const name = [first_name, last_name].filter(Boolean).join(" ") || "Sin nombre";

    logger.info(requestId, "webhook.clerk.user_created", { clerkUserId: id, email });

    await sendTelegramNotification({
      text: [
        "🆕 <b>Nuevo usuario en motorflow</b>",
        "",
        `👤 <b>Nombre:</b> ${escapeTelegramHTML(name)}`,
        `📧 <b>Email:</b> ${escapeTelegramHTML(email)}`,
        `🔑 <b>Clerk ID:</b> <code>${id}</code>`,
        "",
        `Para activar su plan: Clerk dashboard → Users → Edit public metadata`,
        `<code>{ "assignedPlan": "media" }</code>`,
      ].join("\n"),
    }, requestId);
  }

  if (event.type === "user.deleted") {
    const clerkUserId = event.data.id;
    if (!clerkUserId) {
      logger.warn(requestId, "webhook.clerk.user_deleted.missing_id");
      return NextResponse.json({ ok: true });
    }

    const deleted = await prisma.dealershipUser.deleteMany({
      where: { clerkUserId },
    });

    logger.info(requestId, "webhook.clerk.user_deleted", {
      clerkUserId,
      dealershipUsersDeleted: deleted.count,
    });
  }

  return NextResponse.json({ ok: true });
}

// Tipos mínimos de los eventos que manejamos
type UserCreatedEvent = {
  type: "user.created";
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name: string | null;
    last_name: string | null;
  };
};

type UserDeletedEvent = {
  type: "user.deleted";
  data: { id?: string };
};

type WebhookEvent =
  | UserCreatedEvent
  | UserDeletedEvent
  | { type: string; data: Record<string, unknown> };
