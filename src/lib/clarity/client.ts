/**
 * Helpers de Clarity en el BROWSER. Sin `"use client"`: es una librería, y todas
 * las funciones chequean `window`, así que importarla desde el server no rompe.
 *
 * No-op silencioso si Clarity no está montado (variable vacía) o si un
 * adblocker se comió el script.
 */

declare global {
  interface Window {
    clarity?: {
      (...args: unknown[]): void;
      q?: unknown[];
    };
  }
}

/**
 * Eventos custom de Clarity. Sirven para FILTRAR grabaciones y heatmaps
 * ("mostrame las sesiones que fallaron al enviar el form"), no son conversiones.
 * Lista cerrada a propósito: un typo en el nombre crea un evento nuevo en el
 * panel y parte los datos en dos.
 */
export const CLARITY_EVENTS = {
  contactSubmitted: "contact_submitted",
  contactSent: "contact_sent",
  contactFailed: "contact_failed",
  contactValidationError: "contact_validation_error",
  // Sitio del tenant (van al proyecto de Clarity DEL DEALER)
  leadSubmitted: "lead_submitted",
  leadSent: "lead_sent",
  leadFailed: "lead_failed",
  leadValidationError: "lead_validation_error",
} as const;

export type ClarityEventName = (typeof CLARITY_EVENTS)[keyof typeof CLARITY_EVENTS];

export function trackClarityEvent(name: ClarityEventName): void {
  if (typeof window === "undefined" || typeof window.clarity !== "function") return;
  window.clarity("event", name);
}

/**
 * Etiqueta la sesión para segmentar en el panel (ej: `plan=premium`).
 * ⚠️ NUNCA mandar PII (email, teléfono, nombre): los tags se ven en claro.
 */
export function setClarityTag(key: string, value: string): void {
  if (typeof window === "undefined" || typeof window.clarity !== "function") return;
  window.clarity("set", key, value);
}
