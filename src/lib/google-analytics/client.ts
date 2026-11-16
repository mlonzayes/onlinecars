/**
 * Eventos de GA4 en el BROWSER (web principal). Sin `"use client"`: es una
 * librería y todas las funciones chequean `window`.
 *
 * No-op silencioso si GA4 no está montado (variable vacía) o lo bloqueó un adblocker.
 *
 * Para Google Ads: estos eventos se marcan como "eventos clave" en GA4 y se
 * importan como conversiones en Google Ads (con las cuentas vinculadas). No
 * hace falta un tag de Ads aparte.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Lista cerrada: un typo crea otro evento en GA4 y parte los datos.
 *   generate_lead  → mandó el form de contacto (evento RECOMENDADO de GA4)
 *   whatsapp_click → tocó un botón de WhatsApp
 *   phone_click    → tocó el teléfono
 */
export const GA_EVENTS = {
  generateLead: "generate_lead",
  whatsappClick: "whatsapp_click",
  phoneClick: "phone_click",
} as const;

export type GaEventName = (typeof GA_EVENTS)[keyof typeof GA_EVENTS];

/** Params del evento. ⚠️ Nunca PII: GA4 prohíbe mandar email, teléfono o nombre. */
export type GaEventParams = Record<string, string | number | boolean>;

export function trackGaEvent(name: GaEventName, params?: GaEventParams): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params ?? {});
}
