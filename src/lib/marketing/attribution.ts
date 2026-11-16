/**
 * Atribución de campañas de la WEB PRINCIPAL: de qué anuncio vino cada lead.
 *
 * Client-safe (sin zod ni nada del server). El componente `AttributionCapture`
 * guarda los params al entrar y el form de contacto los manda con la consulta.
 *
 * Modelo LAST-TOUCH con params: se pisa solo cuando la URL trae UTMs o un click
 * id. Navegar entre páginas de la landing (sin params) no borra la atribución.
 * Dura 30 días, la ventana de clic típica de Meta y Google.
 */

export const ATTRIBUTION_KEYS = [
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmContent",
  "utmTerm",
  "fbclid",
  "gclid",
  "landingPage",
  "referrer",
] as const;

export type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];
export type Attribution = Partial<Record<AttributionKey, string>>;

/** Campo con el que la atribución viaja en el body de /api/public/contact. */
export const ATTRIBUTION_FIELD = "attribution";
export const ATTRIBUTION_MAX_LENGTH = 300;

const STORAGE_KEY = "mf_attribution";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

const URL_PARAMS: Record<string, AttributionKey> = {
  utm_source: "utmSource",
  utm_medium: "utmMedium",
  utm_campaign: "utmCampaign",
  utm_content: "utmContent",
  utm_term: "utmTerm",
  fbclid: "fbclid",
  gclid: "gclid",
};

interface StoredAttribution {
  data: Attribution;
  savedAt: number;
}

function clip(value: string): string {
  return value.slice(0, ATTRIBUTION_MAX_LENGTH);
}

/** Lee los params de la URL actual y los guarda si hay alguno. */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const data: Attribution = {};
  for (const [param, key] of Object.entries(URL_PARAMS)) {
    const value = params.get(param)?.trim();
    if (value) data[key] = clip(value);
  }
  if (Object.keys(data).length === 0) return;

  data.landingPage = clip(window.location.pathname + window.location.search);
  // Solo el host: el path del referrer puede traer datos de otro sitio.
  try {
    const ref = document.referrer ? new URL(document.referrer) : null;
    if (ref && ref.host !== window.location.host) data.referrer = clip(ref.host);
  } catch {
    // referrer inválido: se ignora
  }

  try {
    const stored: StoredAttribution = { data, savedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // storage bloqueado (modo privado, cookies apagadas): se pierde la atribución, no el lead
  }
}

/** Atribución vigente, o `{}` si no hay o venció. */
export function readAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const stored = JSON.parse(raw) as Partial<StoredAttribution>;
    if (!stored.data || typeof stored.savedAt !== "number") return {};
    if (Date.now() - stored.savedAt > TTL_MS) return {};
    const result: Attribution = {};
    for (const key of ATTRIBUTION_KEYS) {
      const value = stored.data[key];
      if (typeof value === "string" && value) result[key] = clip(value);
    }
    return result;
  } catch {
    return {};
  }
}
