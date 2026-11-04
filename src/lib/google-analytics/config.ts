/**
 * Configuración PÚBLICA de Google Analytics 4 de la WEB PRINCIPAL. Client-safe:
 * solo lee `NEXT_PUBLIC_*`.
 *
 * Igual que el pixel de Meta y Clarity, la PRESENCIA de la variable es el
 * interruptor. Para apagarlo, vaciás la variable y redeployás.
 */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || null;

/**
 * El measurement id de GA4 tiene la forma "G-XXXXXXXXXX". Validamos el shape
 * antes de interpolarlo en un script inline para no inyectar basura en el HTML.
 */
export function isValidGaMeasurementId(value: string | null | undefined): value is string {
  if (!value) return false;
  return /^G-[A-Z0-9]{6,12}$/.test(value.trim());
}

/** Measurement id de la web principal, ya validado. `null` = GA4 apagado. */
export function getMainSiteGaId(): string | null {
  return isValidGaMeasurementId(GA_MEASUREMENT_ID) ? GA_MEASUREMENT_ID : null;
}
