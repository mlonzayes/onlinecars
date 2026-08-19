/**
 * POST /api/public/contact
 *
 * Endpoint público del form de contacto del landing. Sirve dos casos:
 *  - intent="plan": el visitante quiere contratar un plan (info clave: qué plan)
 *  - intent="demo": el visitante quiere probar gratis (alta manual por ventas)
 *  - intent="otro": consulta genérica
 *
 * Si están seteadas TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID, mandamos una
 * notificación al chat del equipo para que ventas reaccione rápido. Si Telegram
 * está caído o no configurado, la consulta queda igual aceptada (fail-open).
 *
 * Protecciones:
 *  - Rate limit por IP (waitlistLimiter — sliding window)
 *  - Honeypot (campo invisible que solo bots llenan → 201 fake, no 4xx)
 *  - Zod parse con .strict() — no aceptamos campos extras del body
 */
import { NextResponse, after } from "next/server";
import { z } from "zod";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { applyRateLimit, getClientIp, waitlistLimiter } from "@/lib/rate-limit";
import { isHoneypotTriggered, HONEYPOT_FIELD } from "@/lib/honeypot";
import { sendTelegramNotification, escapeTelegramHTML } from "@/lib/telegram";
import {
  extractMetaBrowserSignals,
  getMainSiteCapiCredentials,
  sendMetaConversionEvent,
} from "@/lib/meta/capi";
import { META_EVENT_ID_FIELD } from "@/lib/meta/events";

// Coordinar con src/components/landing/contact-form.tsx — los valores tienen
// que matchear 1:1.
const INTENT_VALUES = ["plan", "demo", "otro"] as const;
const PLAN_VALUES = ["base", "media", "premium", "enterprise", "no_se"] as const;

const INTENT_LABELS: Record<(typeof INTENT_VALUES)[number], string> = {
  plan: "💰 Quiere contratar un plan",
  demo: "🎁 Quiere probar gratis (demo)",
  otro: "💬 Consulta genérica",
};

const PLAN_LABELS: Record<(typeof PLAN_VALUES)[number], string> = {
  base: "Base",
  media: "Media",
  premium: "Premium",
  enterprise: "Enterprise",
  no_se: "No definido",
};

const contactSchema = z
  .object({
    intent: z.enum(INTENT_VALUES),
    plan: z.enum(PLAN_VALUES).optional(),
    name: z.string().min(2, "Nombre requerido").max(150),
    email: z.string().email("Email inválido").max(200),
    phone: z.string().max(40).optional(),
    dealership: z.string().max(150).optional(),
    message: z.string().max(2000).optional(),
    // Id que deduplica este Lead contra el que ya disparó el pixel del browser.
    // Lo genera el cliente (ver src/lib/meta/client.ts). Opcional: si el
    // visitante tiene un adblocker, el pixel no corrió y solo llega la CAPI —
    // que es justamente el caso que la CAPI viene a cubrir.
    [META_EVENT_ID_FIELD]: z.string().uuid().optional(),
  })
  .strict();

export const POST = withLogger(async (req, { requestId }) => {
  const ip = getClientIp(req);
  const rl = await applyRateLimit(waitlistLimiter, ip, requestId);

  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiadas consultas. Probá en unos minutos." },
      { status: 429, headers: rl.headers }
    );
  }

  const body = await req.json().catch(() => ({}));

  if (isHoneypotTriggered(body)) {
    logger.warn(requestId, "contact.honeypot_triggered");
    // 201 fake — no le enseñamos al bot que detectamos el honeypot.
    return NextResponse.json(
      { success: true },
      { status: 201, headers: rl.headers }
    );
  }

  // El honeypot llega en el body pero el schema es .strict() y no lo declara.
  // Lo sacamos acá (ya lo chequeamos arriba) para que el parse no falle.
  if (body && typeof body === "object") {
    delete (body as Record<string, unknown>)[HONEYPOT_FIELD];
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    logger.warn(requestId, "contact.invalid_input", {
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400, headers: rl.headers }
    );
  }

  const { intent, plan, name, email, phone, dealership, message } = parsed.data;

  logger.info(requestId, "contact.received", { intent, plan, email });

  // Notificación a Telegram — fire-and-forget. NO la await-eamos para que el
  // usuario no vea el spinner los 1-3s que tarda la API de Telegram. Si falla,
  // ya quedó loggeado server-side.
  const e = (v: string | null | undefined) =>
    v ? escapeTelegramHTML(v) : "—";

  const lines = [
    INTENT_LABELS[intent],
    "",
    `<b>Nombre:</b> ${e(name)}`,
    `<b>Email:</b> ${e(email)}`,
    `<b>Teléfono:</b> ${e(phone)}`,
    `<b>Concesionario:</b> ${e(dealership)}`,
  ];
  if (intent === "plan") {
    lines.push(`<b>Plan de interés:</b> ${PLAN_LABELS[plan ?? "no_se"]}`);
  }
  if (message) {
    lines.push("", "<b>Mensaje:</b>", e(message));
  }
  const text = lines.join("\n");

  void sendTelegramNotification({ text }, requestId);

  // --- Conversión a Meta (Conversions API) ---
  //
  // Va en `after()` y NO en `void`: en Vercel, una promesa suelta después del
  // return se puede cortar cuando la función se congela. `after()` le avisa al
  // runtime que mantenga viva la invocación. Telegram usa `void` porque perder
  // un aviso es molesto; perder una conversión te desoptimiza la campaña y te
  // sube el costo por lead, así que este sí tiene que llegar.
  //
  // Y va DESPUÉS de la respuesta: el visitante no espera a Meta.
  const capi = getMainSiteCapiCredentials();
  if (capi) {
    const eventId = parsed.data[META_EVENT_ID_FIELD] ?? globalThis.crypto.randomUUID();
    const eventSourceUrl = req.headers.get("referer");
    const signals = extractMetaBrowserSignals(req, eventSourceUrl);
    // El form pide un campo "nombre" suelto. Separamos por el primer espacio:
    // aproximado, pero un match parcial suma más de lo que resta.
    const [firstName, ...rest] = name.trim().split(/\s+/);

    after(async () => {
      await sendMetaConversionEvent({
        credentials: capi,
        eventName: "Lead",
        eventId,
        eventSourceUrl,
        userData: {
          email,
          phone,
          firstName,
          lastName: rest.join(" ") || null,
          country: "AR",
          clientIpAddress: ip,
          ...signals,
        },
        customData: {
          contentName: `contacto-${intent}`,
          contentCategory: "saas-motorflow",
          ...(plan ? { plan } : {}),
        },
        requestId,
        logContext: { intent, surface: "marketing" },
      });
    });
  }

  return NextResponse.json(
    { success: true },
    { status: 201, headers: rl.headers }
  );
});
