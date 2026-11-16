/**
 * Lead del form de contacto de la WEB PRINCIPAL: validación de la atribución,
 * guardado en DB y texto del aviso a Telegram. SERVER-ONLY.
 */
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { escapeTelegramHTML } from "@/lib/telegram";
import { ATTRIBUTION_MAX_LENGTH, type Attribution } from "./attribution";

// Coordinar con src/components/landing/contact-form.tsx — los valores tienen
// que matchear 1:1.
export const INTENT_VALUES = ["plan", "demo", "otro"] as const;
export const PLAN_VALUES = ["base", "media", "premium", "enterprise", "no_se"] as const;

type ContactIntent = (typeof INTENT_VALUES)[number];
type ContactPlan = (typeof PLAN_VALUES)[number];

const INTENT_LABELS: Record<ContactIntent, string> = {
  plan: "💰 Quiere contratar un plan",
  demo: "🎁 Quiere probar gratis (demo)",
  otro: "💬 Consulta genérica",
};

const PLAN_LABELS: Record<ContactPlan, string> = {
  base: "Base",
  media: "Media",
  premium: "Premium",
  enterprise: "Enterprise",
  no_se: "No definido",
};

const attributionValue =z.string().trim().max(ATTRIBUTION_MAX_LENGTH).optional();

// .strip() (default) y no .strict(): si el cliente viejo cacheado manda una key
// de más, perder ese campo es mejor que rechazar el lead.
export const attributionSchema = z
  .object({
    utmSource: attributionValue,
    utmMedium: attributionValue,
    utmCampaign: attributionValue,
    utmContent: attributionValue,
    utmTerm: attributionValue,
    fbclid: attributionValue,
    gclid: attributionValue,
    landingPage: attributionValue,
    referrer: attributionValue,
  })
  .optional();

export interface MarketingLeadInput {
  intent: ContactIntent;
  plan?: ContactPlan;
  name: string;
  email: string;
  phone?: string;
  dealership?: string;
  message?: string;
  attribution: Attribution;
}

/**
 * Guarda el lead. Devuelve el id, o null si la DB falló: en ese caso el aviso
 * de Telegram lo marca para cargarlo a mano (no se rechaza al visitante).
 */
export async function saveMarketingLead(
  input: MarketingLeadInput,
  requestId: string
): Promise<string | null> {
  const blankToNull = (v: string | undefined) => (v && v.trim() ? v : null);
  try {
    const lead = await prisma.marketingLead.create({
      data: {
        intent: input.intent,
        plan: input.plan ?? null,
        name: input.name,
        email: input.email,
        phone: blankToNull(input.phone),
        dealership: blankToNull(input.dealership),
        message: blankToNull(input.message),
        utmSource: input.attribution.utmSource ?? null,
        utmMedium: input.attribution.utmMedium ?? null,
        utmCampaign: input.attribution.utmCampaign ?? null,
        utmContent: input.attribution.utmContent ?? null,
        utmTerm: input.attribution.utmTerm ?? null,
        fbclid: input.attribution.fbclid ?? null,
        gclid: input.attribution.gclid ?? null,
        landingPage: input.attribution.landingPage ?? null,
        referrer: input.attribution.referrer ?? null,
        requestId,
      },
      select: { id: true },
    });
    return lead.id;
  } catch (error) {
    logger.error(requestId, "contact.persist_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

const e = (v: string | null | undefined) => (v ? escapeTelegramHTML(v) : "—");

/** Texto del aviso a Telegram. Con `leadId` null, avisa que hay que cargarlo a mano. */
export function buildContactTelegramText(input: MarketingLeadInput, leadId: string | null): string {
  const lines = [
    INTENT_LABELS[input.intent],
    "",
    `<b>Nombre:</b> ${e(input.name)}`,
    `<b>Email:</b> ${e(input.email)}`,
    `<b>Teléfono:</b> ${e(input.phone)}`,
    `<b>Concesionario:</b> ${e(input.dealership)}`,
  ];
  if (input.intent === "plan") {
    lines.push(`<b>Plan de interés:</b> ${PLAN_LABELS[input.plan ?? "no_se"]}`);
  }
  if (input.message) lines.push("", "<b>Mensaje:</b>", e(input.message));
  lines.push("", ...formatAttributionLines(input.attribution));
  if (!leadId) lines.push("", "⚠️ <b>No se guardó en la DB</b> — cargalo a mano.");
  return lines.join("\n");
}

/** Líneas de origen para el aviso: de qué campaña/anuncio vino el lead. */
function formatAttributionLines(attribution: Attribution): string[] {
  const { utmSource, utmMedium, utmCampaign, utmContent, utmTerm, fbclid, gclid, referrer } =
    attribution;
  const clickFrom = [fbclid && "Meta", gclid && "Google"].filter(Boolean).join(" + ");
  if (!utmSource && !utmCampaign && !clickFrom) {
    return [`<b>Origen:</b> ${referrer ? e(referrer) : "orgánico / directo"}`];
  }
  const lines = [
    `<b>Origen:</b> ${e(utmSource)} / ${e(utmMedium)}`,
    `<b>Campaña:</b> ${e(utmCampaign)}`,
  ];
  if (utmContent) lines.push(`<b>Anuncio:</b> ${e(utmContent)}`);
  if (utmTerm) lines.push(`<b>Término:</b> ${e(utmTerm)}`);
  if (clickFrom) lines.push(`<b>Click de anuncio:</b> ${clickFrom}`);
  return lines;
}
