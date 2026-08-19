/**
 * Configuración PÚBLICA del tracking de Meta. Este archivo es client-safe:
 * solo lee variables `NEXT_PUBLIC_*`, así que se puede importar desde un
 * Client Component sin filtrar nada.
 *
 * Los secretos (access token de la Conversions API) viven en `capi.ts`, que es
 * server-only. NO agregar acá ninguna env var sin prefijo NEXT_PUBLIC.
 */

/**
 * Pixel de la WEB PRINCIPAL (motorflowapp.com). Es el nuestro: mide el funnel
 * de venta del SaaS.
 *
 * La presencia de esta variable ES el feature flag — no hay un
 * `META_TRACKING_ENABLED` aparte a propósito. Dos switches para lo mismo
 * terminan siempre en "estaba prendido pero no medía". Para apagar el tracking:
 * vaciás la variable y redeployás.
 */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || null;

/**
 * Versión de la Graph API contra la que hablamos. Meta soporta ~2 años cada
 * versión; subirla es un cambio consciente, no algo que quede flotando en un
 * default. Al subirla, revisar el changelog de `user_data` (los campos de
 * matching son lo que más cambia).
 */
export const META_GRAPH_API_VERSION = "v21.0";

/**
 * Un pixel id es numérico, típicamente de 15-16 dígitos. Validamos el shape
 * antes de renderizar el script para no inyectar basura en el HTML si un dealer
 * pega cualquier cosa en el campo del dashboard.
 */
export function isValidMetaPixelId(value: string | null | undefined): value is string {
  if (!value) return false;
  return /^\d{10,20}$/.test(value.trim());
}

/** Pixel de la web principal, ya validado. `null` = tracking apagado. */
export function getMainSitePixelId(): string | null {
  return isValidMetaPixelId(META_PIXEL_ID) ? META_PIXEL_ID : null;
}

/**
 * Resuelve el pixel del sitio público de un concesionario.
 *
 * Devuelve `null` si el dealer no lo configuró o si tiene el tracking apagado.
 * El gating por plan NO se decide acá — se enforza en el handler que guarda la
 * config (defense in depth: la UI gatea, el server también).
 */
export function getTenantPixelId(dealership: {
  metaPixelId?: string | null;
  metaTrackingEnabled?: boolean | null;
}): string | null {
  if (!dealership.metaTrackingEnabled) return null;
  return isValidMetaPixelId(dealership.metaPixelId) ? dealership.metaPixelId.trim() : null;
}
