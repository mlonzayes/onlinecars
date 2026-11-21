/**
 * Clicks a WhatsApp / teléfono de la WEB PRINCIPAL. Client-safe.
 *
 * Mucha gente escribe por WhatsApp en vez de usar el form. Sin medir esos
 * clicks, Meta y Google ven menos conversiones de las que hay y suben el costo
 * por resultado. Se manda a las tres herramientas:
 *   Meta    → `Contact` (estándar), solo pixel: no hay datos para la CAPI.
 *   GA4     → `whatsapp_click` / `phone_click` (marcables como evento clave → Google Ads).
 *   Clarity → para filtrar grabaciones.
 */
import { trackMetaEvent } from "@/lib/meta/client";
import { GA_EVENTS, trackGaEvent } from "@/lib/google-analytics/client";
import { CLARITY_EVENTS, trackClarityEvent } from "@/lib/clarity/client";

/** Atributo con el que cada link declara dónde está (fab, faq, footer...). */
export const CONTACT_LOCATION_ATTR = "data-contact-location";

export type ContactMethod = "whatsapp" | "phone";

const WHATSAPP_HOSTS = ["wa.me", "api.whatsapp.com", "web.whatsapp.com"];

/** Método de contacto de un href, o null si no es WhatsApp ni teléfono. */
export function getContactMethod(href: string): ContactMethod | null {
  if (href.startsWith("tel:")) return "phone";
  try {
    const host = new URL(href).host;
    return WHATSAPP_HOSTS.includes(host) ? "whatsapp" : null;
  } catch {
    return null;
  }
}

export function trackContactClick(method: ContactMethod, location: string): void {
  trackMetaEvent("Contact", {
    contentName: `${method}-${location}`,
    contentCategory: "saas-motorflow",
  });
  trackGaEvent(method === "whatsapp" ? GA_EVENTS.whatsappClick : GA_EVENTS.phoneClick, {
    location,
  });
  trackClarityEvent(
    method === "whatsapp" ? CLARITY_EVENTS.contactWhatsappClick : CLARITY_EVENTS.contactPhoneClick
  );
}
