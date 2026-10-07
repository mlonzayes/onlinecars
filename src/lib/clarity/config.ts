/**
 * Configuración PÚBLICA de Microsoft Clarity (heatmaps + grabaciones de sesión)
 * de la WEB PRINCIPAL. Client-safe: solo lee `NEXT_PUBLIC_*`.
 *
 * Igual que el pixel de Meta, la PRESENCIA de la variable es el interruptor: no
 * hay un `CLARITY_ENABLED` aparte. Para apagarlo, vaciás la variable y
 * redeployás.
 */
export const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() || null;

/**
 * El project id de Clarity es alfanumérico corto (ej: "abc123xyz0"). Validamos
 * el shape antes de interpolarlo en un script inline para no inyectar basura en
 * el HTML.
 */
export function isValidClarityProjectId(value: string | null | undefined): value is string {
  if (!value) return false;
  return /^[a-z0-9]{6,20}$/i.test(value.trim());
}

/**
 * Proyecto de Clarity del sitio público de un concesionario, ya validado.
 * El gating por plan NO se decide acá: lo chequea quien monta el script.
 */
export function getTenantClarityId(dealership: {
  clarityProjectId?: string | null;
}): string | null {
  const id = dealership.clarityProjectId?.trim();
  return isValidClarityProjectId(id) ? id : null;
}

/** Project id de la web principal, ya validado. `null` = Clarity apagado. */
export function getMainSiteClarityId(): string | null {
  return isValidClarityProjectId(CLARITY_PROJECT_ID) ? CLARITY_PROJECT_ID : null;
}
