/**
 * Cliente de la Conversions API de Meta (tracking SERVER-SIDE).
 *
 * ⚠️ SERVER-ONLY. Lee `META_CAPI_ACCESS_TOKEN` y tokens de la DB. NUNCA
 * importar este archivo desde un Client Component ni desde `config.ts`.
 *
 * POR QUÉ CAPI Y NO SOLO EL PIXEL: entre adblockers, ITP de Safari y el
 * consentimiento de iOS, el pixel del browser pierde entre 20% y 40% de las
 * conversiones. Meta optimiza la campaña con lo que recibe: si le llega la
 * mitad de los leads, te sube el costo por lead porque cree que convertís poco.
 * El server no lo bloquea nadie.
 *
 * DEDUPLICACIÓN: el mismo evento se manda DOS veces (pixel + CAPI). Meta las
 * une si comparten `event_name` + `event_id`. Ese id lo genera el CLIENTE y
 * viaja en el body del POST — ver META_EVENT_ID_FIELD en `events.ts`. Si el id
 * no llega, contás la conversión doble.
 */
import { logger } from "@/lib/logger";
import { META_GRAPH_API_VERSION, isValidMetaPixelId } from "./config";
import { buildHashedUserData } from "./hash";
import { META_BROWSER_ID_COOKIE, META_CLICK_ID_COOKIE, type MetaEventName } from "./events";
import type { MetaCustomData, MetaPixelCredentials, MetaUserData } from "./types";

/** Timeout duro. La CAPI normalmente responde en <500ms; más que esto es que algo anda mal. */
const CAPI_TIMEOUT_MS = 3000;

/**
 * Credenciales de la WEB PRINCIPAL (nuestro funnel de venta del SaaS).
 * `null` si falta el pixel o el token — sin los dos no hay nada que mandar.
 */
export function getMainSiteCapiCredentials(): MetaPixelCredentials | null {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  if (!isValidMetaPixelId(pixelId) || !accessToken) return null;
  return {
    pixelId,
    accessToken,
    testEventCode: process.env.META_CAPI_TEST_EVENT_CODE?.trim() || null,
  };
}

/**
 * Credenciales del sitio público de un CONCESIONARIO. El token sale de la DB.
 *
 * ⚠️ El `metaCapiToken` es un secreto del dealer: no puede salir del server ni
 * entrar al bundle cacheado del tenant. Solo se usa acá.
 */
export function getTenantCapiCredentials(dealership: {
  metaPixelId?: string | null;
  metaCapiToken?: string | null;
  metaTestEventCode?: string | null;
  metaTrackingEnabled?: boolean | null;
}): MetaPixelCredentials | null {
  if (!dealership.metaTrackingEnabled) return null;
  const pixelId = dealership.metaPixelId?.trim();
  const accessToken = dealership.metaCapiToken?.trim();
  if (!isValidMetaPixelId(pixelId) || !accessToken) return null;
  return {
    pixelId,
    accessToken,
    testEventCode: dealership.metaTestEventCode?.trim() || null,
  };
}

/**
 * Extrae del request las señales que el pixel dejó en el browser.
 *
 * `_fbc` es la más valiosa: guarda el click id del anuncio, o sea la prueba de
 * que esta persona vino de una publicidad tuya. Sin ella Meta no puede atribuir
 * la conversión a la campaña, y la campaña "no funciona" en el reporte.
 *
 * Si el visitante llegó recién de un ad, el pixel todavía puede no haber
 * escrito la cookie — por eso también reconstruimos `_fbc` desde el `fbclid`
 * de la URL, que es el formato oficial `fb.1.{timestamp}.{fbclid}`.
 */
export function extractMetaBrowserSignals(
  request: Request,
  eventSourceUrl?: string | null
): Pick<MetaUserData, "fbp" | "fbc" | "clientUserAgent"> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const readCookie = (name: string): string | null => {
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  };

  let fbc = readCookie(META_CLICK_ID_COOKIE);

  if (!fbc && eventSourceUrl) {
    try {
      const fbclid = new URL(eventSourceUrl).searchParams.get("fbclid");
      if (fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;
    } catch {
      // URL inválida mandada por el cliente — la ignoramos, no es motivo de error.
    }
  }

  return {
    fbp: readCookie(META_BROWSER_ID_COOKIE),
    fbc,
    clientUserAgent: request.headers.get("user-agent"),
  };
}

export interface SendMetaEventInput {
  credentials: MetaPixelCredentials;
  eventName: MetaEventName;
  /** Compartido con el pixel del browser. Sin esto hay conteo doble. */
  eventId: string;
  /** URL donde ocurrió el evento (la del browser, no la del endpoint). */
  eventSourceUrl?: string | null;
  userData: MetaUserData;
  customData?: MetaCustomData;
  /** Para trazar el evento con el resto del request en los logs. */
  requestId?: string;
  /** Contexto extra para el log. NUNCA meter PII acá. */
  logContext?: Record<string, unknown>;
}

/** camelCase → snake_case, que es lo que espera la API de Meta. */
function toSnakeCaseCustomData(data: MetaCustomData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    out[key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)] = value;
  }
  return out;
}

/**
 * Manda un evento a la Conversions API.
 *
 * FAIL-OPEN, siempre: si Meta está caído, con rate limit o el token venció, se
 * loggea y se devuelve `{ ok: false }`. Jamás tira. Mismo criterio que el rate
 * limit de Upstash y las notificaciones de Telegram del proyecto: perder una
 * métrica es malo, perder el lead del cliente es inaceptable.
 */
export async function sendMetaConversionEvent(
  input: SendMetaEventInput
): Promise<{ ok: boolean }> {
  const { credentials, eventName, eventId, eventSourceUrl, userData, customData, requestId } = input;

  // El pixel id sí se puede loggear (es público, está en el HTML). El token NO.
  const logMeta = {
    eventName,
    eventId,
    pixelId: credentials.pixelId,
    ...input.logContext,
  };

  try {
    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: "website",
          ...(eventSourceUrl ? { event_source_url: eventSourceUrl } : {}),
          user_data: await buildHashedUserData(userData),
          ...(customData ? { custom_data: toSnakeCaseCustomData(customData) } : {}),
        },
      ],
      ...(credentials.testEventCode ? { test_event_code: credentials.testEventCode } : {}),
    };

    const url = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${credentials.pixelId}/events`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // El token va en el header y NO en la query string: la query se loggea
        // en proxies y CDNs, el header no.
        Authorization: `Bearer ${credentials.accessToken}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(CAPI_TIMEOUT_MS),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      logger.error(requestId, "meta.capi.rejected", {
        ...logMeta,
        status: response.status,
        // Recortado: los errores de Meta pueden venir enormes y el body puede
        // devolver de vuelta parte del payload.
        detail: detail.slice(0, 500),
      });
      return { ok: false };
    }

    logger.info(requestId, "meta.capi.sent", logMeta);
    return { ok: true };
  } catch (error) {
    logger.error(requestId, "meta.capi.failed", {
      ...logMeta,
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false };
  }
}
