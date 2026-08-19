/**
 * Helpers del pixel de Meta en el BROWSER.
 *
 * No lleva `"use client"` a propósito: es una librería, no un componente. Todas
 * las funciones chequean que exista `window`, así que importarla desde un
 * Server Component no rompe — simplemente no hace nada.
 */
import type { MetaEventName } from "./events";
import type { MetaCustomData } from "./types";

declare global {
  interface Window {
    fbq?: {
      (...args: unknown[]): void;
      queue?: unknown[];
    };
  }
}

/**
 * Genera el id que deduplica el evento del pixel contra el de la Conversions API.
 *
 * LO GENERA EL CLIENTE, NO EL SERVER. Tiene que ser el MISMO valor en las dos
 * puntas: se dispara `fbq(..., { eventID })` y se manda ese mismo id en el body
 * del POST. Si cada lado genera el suyo, Meta ve dos eventos distintos y contás
 * la conversión dos veces.
 */
export function newMetaEventId(): string {
  return globalThis.crypto.randomUUID();
}

/**
 * Dispara un evento estándar por el pixel del browser.
 *
 * No-op silencioso si el pixel no está montado (tracking apagado) o si un
 * adblocker se comió el script. Eso NO es un error: para eso está la
 * Conversions API del lado del server.
 */
export function trackMetaEvent(
  eventName: MetaEventName,
  customData?: MetaCustomData,
  options?: { eventId?: string }
): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;

  window.fbq(
    "track",
    eventName,
    customData ?? {},
    options?.eventId ? { eventID: options.eventId } : undefined
  );
}

/**
 * Dispara el evento por el pixel y devuelve el `eventId` para mandarlo al
 * server. Es el atajo que deberían usar los formularios: garantiza que las dos
 * puntas comparten el id sin que cada form tenga que acordarse.
 *
 * ```ts
 * const eventId = trackMetaEventWithId("Lead", { contentName: "contacto" });
 * await fetch("/api/public/contact", {
 *   body: JSON.stringify({ ...payload, [META_EVENT_ID_FIELD]: eventId }),
 * });
 * ```
 */
export function trackMetaEventWithId(
  eventName: MetaEventName,
  customData?: MetaCustomData
): string {
  const eventId = newMetaEventId();
  trackMetaEvent(eventName, customData, { eventId });
  return eventId;
}
