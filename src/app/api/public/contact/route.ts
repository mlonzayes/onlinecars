/**
 * POST /api/public/contact
 *
 * Endpoint público del form de contacto del landing. Sirve dos casos:
 *  - intent="plan": el visitante quiere contratar un plan (info clave: qué plan)
 *  - intent="demo": el visitante quiere probar gratis (alta manual por ventas)
 *  - intent="otro": consulta genérica
 *
 * La consulta se GUARDA en `marketing_leads` con la atribución de la campaña
 * (UTMs + click ids) y después se avisa por Telegram para que ventas reaccione
 * rápido. Si la DB falla, el aviso sale igual marcado para cargarlo a mano; si
 * Telegram falla, el lead ya quedó en la DB. Fail-open: el visitante nunca ve el error.
 *
 * Request:  { intent: "plan", plan: "media", name: "Juan Pérez", email: "juan@x.com",
 *             metaEventId: "<uuid>", attribution: { utmSource: "facebook", utmCampaign: "lanzamiento" } }
 * Response: 201 { success: true }
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
import { sendTelegramNotification } from "@/lib/telegram";
import { ATTRIBUTION_FIELD } from "@/lib/marketing/attribution";
import {
  INTENT_VALUES,
  PLAN_VALUES,
  attributionSchema,
  buildContactTelegramText,
  saveMarketingLead,
} from "@/lib/marketing/contact-lead";
import {
  extractMetaBrowserSignals,
  getMainSiteCapiCredentials,
  sendMetaConversionEvent,
} from "@/lib/meta/capi";
import { META_EVENT_ID_FIELD } from "@/lib/meta/events";

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
    [ATTRIBUTION_FIELD]: attributionSchema,
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

  const attribution = parsed.data[ATTRIBUTION_FIELD] ?? {};

  const leadId = await saveMarketingLead(
    { intent, plan, name, email, phone, dealership, message, attribution },
    requestId
  );

  // Sin email ni teléfono: los logs no llevan PII.
  logger.info(requestId, "contact.received", {
    leadId,
    intent,
    plan,
    utmSource: attribution.utmSource,
    utmCampaign: attribution.utmCampaign,
  });

  const text = buildContactTelegramText(
    { intent, plan, name, email, phone, dealership, message, attribution },
    leadId
  );

  // `after()` y no `void`: con la DB caída este aviso es la ÚNICA copia del
  // lead, y en Vercel una promesa suelta se puede cortar al congelar la función.
  // Igual va después de la respuesta: el visitante no espera a Telegram.
  after(async () => {
    await sendTelegramNotification({ text }, requestId);
  });

  // --- Conversión a Meta (Conversions API) ---
  //
  // También en `after()`: perder una conversión desoptimiza la campaña.
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
