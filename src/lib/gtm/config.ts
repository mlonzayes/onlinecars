/**
 * Configuración PÚBLICA de Google Tag Manager de la WEB PRINCIPAL. Client-safe:
 * solo lee `NEXT_PUBLIC_*`.
 *
 * Igual que Meta y Clarity, la PRESENCIA de la variable es el interruptor: no
 * hay un `GTM_ENABLED` aparte. Para apagarlo, vaciás la variable y redeployás.
 * Google Analytics (GA4) se configura ADENTRO del contenedor de GTM, no acá.
 */
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim() || null;

/**
 * El id de un contenedor es `GTM-` + alfanumérico (ej: "GTM-NBH3NSPX").
 * Validamos el shape antes de interpolarlo en un script inline para no
 * inyectar basura en el HTML.
 */
export function isValidGtmId(value: string | null | undefined): value is string {
  if (!value) return false;
  return /^GTM-[A-Z0-9]{4,12}$/.test(value.trim());
}

/** Contenedor de la web principal, ya validado. `null` = GTM apagado. */
export function getMainSiteGtmId(): string | null {
  return isValidGtmId(GTM_ID) ? GTM_ID : null;
}
