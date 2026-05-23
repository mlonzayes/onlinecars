/**
 * Cliente HTTP para la API de Mercado Libre.
 *
 * Responsabilidades:
 * - Obtener access token válido (con auto-refresh si está por vencer)
 * - Publicar, actualizar, pausar y cerrar items
 * - Subir imágenes al endpoint de ML pictures
 * - Obtener info de preguntas (para webhooks → leads)
 *
 * Umbrales de refresh: refrescamos si el token vence en menos de 5 minutos.
 */
import { getTokens, updateTokens } from "./token-store";
import type {
  MLCreateItemPayload,
  MLItemResponse,
  MLTokenResponse,
  MLUpdateStatusPayload,
  MLUserInfo,
  MLQuestion,
} from "./types";

const ML_API_BASE = "https://api.mercadolibre.com";
const ML_AUTH_BASE = "https://auth.mercadolibre.com.ar";
// El token endpoint vive en api.mercadolibre.com/oauth/token, NO en auth.*.
// El host auth.* es solo para la pantalla de autorización del usuario.
const ML_TOKEN_URL = `${ML_API_BASE}/oauth/token`;
const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutos antes de que venza

function getAppCredentials() {
  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("ML_CLIENT_ID y ML_CLIENT_SECRET son requeridos.");
  }
  return { clientId, clientSecret };
}

// ─── Token management ─────────────────────────────────────────────────────────

/**
 * Devuelve un access token válido. Si está por vencer, lo refresca primero.
 */
async function getValidAccessToken(dealershipId: string): Promise<string> {
  const tokens = await getTokens(dealershipId);
  if (!tokens) {
    throw new Error("El concesionario no tiene cuenta de Mercado Libre conectada.");
  }

  // ¿Todavía válido?
  if (tokens.expiresAt.getTime() - Date.now() > REFRESH_BUFFER_MS) {
    return tokens.accessToken;
  }

  // Refresh
  const { clientId, clientSecret } = getAppCredentials();
  const res = await fetch(ML_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokens.refreshToken,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error refrescando token ML: ${errorText}`);
  }

  const refreshed: MLTokenResponse = await res.json();
  await updateTokens(dealershipId, refreshed);
  return refreshed.access_token;
}

/**
 * Intercambia un código de autorización por access + refresh tokens.
 * Llamado desde el callback OAuth2.
 */
export async function exchangeCode(code: string, redirectUri: string): Promise<MLTokenResponse> {
  const { clientId, clientSecret } = getAppCredentials();
  const res = await fetch(ML_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error en OAuth2 ML: ${errorText}`);
  }

  return res.json();
}

// ─── Helpers HTTP ─────────────────────────────────────────────────────────────

async function mlFetch<T>(
  dealershipId: string,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getValidAccessToken(dealershipId);
  const res = await fetch(`${ML_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    let errorBody: string;
    try {
      const errJson = await res.json();
      // ML mete el detalle de qué validación falló en `cause` (array) o `errors`.
      // Si solo agarramos `.message`, perdemos la info clave (ej: "attribute YEAR is missing").
      const parts: string[] = [];
      if (errJson.message) parts.push(errJson.message);
      if (Array.isArray(errJson.cause) && errJson.cause.length > 0) {
        parts.push(JSON.stringify(errJson.cause));
      }
      if (Array.isArray(errJson.errors) && errJson.errors.length > 0) {
        parts.push(JSON.stringify(errJson.errors));
      }
      errorBody = parts.length > 0 ? parts.join(" | ") : JSON.stringify(errJson);
    } catch {
      errorBody = await res.text();
    }
    throw new Error(`ML API ${res.status}: ${errorBody}`);
  }

  return res.json();
}

// ─── User info ────────────────────────────────────────────────────────────────

export async function getMLUserInfo(dealershipId: string): Promise<MLUserInfo> {
  return mlFetch<MLUserInfo>(dealershipId, "/users/me");
}

// ─── Items ────────────────────────────────────────────────────────────────────

export async function publishItem(
  dealershipId: string,
  payload: MLCreateItemPayload
): Promise<MLItemResponse> {
  return mlFetch<MLItemResponse>(dealershipId, "/items", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateItemStatus(
  dealershipId: string,
  mlItemId: string,
  payload: MLUpdateStatusPayload
): Promise<MLItemResponse> {
  return mlFetch<MLItemResponse>(dealershipId, `/items/${mlItemId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getItem(
  dealershipId: string,
  mlItemId: string
): Promise<MLItemResponse> {
  return mlFetch<MLItemResponse>(dealershipId, `/items/${mlItemId}`);
}

// ─── Pictures ─────────────────────────────────────────────────────────────────

/**
 * Sube una imagen al endpoint de ML usando la URL pública (source).
 * ML descarga la imagen desde la URL. Requiere que la URL sea pública.
 */
export async function uploadPicture(
  dealershipId: string,
  imageUrl: string
): Promise<{ id: string; url: string }> {
  const token = await getValidAccessToken(dealershipId);
  const res = await fetch(`${ML_API_BASE}/pictures`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ source: imageUrl }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error subiendo imagen a ML: ${errorText}`);
  }

  const data = await res.json();
  return { id: data.id, url: data.url };
}

// ─── Questions ────────────────────────────────────────────────────────────────

export async function getQuestion(
  dealershipId: string,
  questionId: string
): Promise<MLQuestion> {
  return mlFetch<MLQuestion>(dealershipId, `/questions/${questionId}`);
}

// ─── OAuth2 URL builder ───────────────────────────────────────────────────────

export function buildAuthUrl(state: string): string {
  const { clientId } = getAppCredentials();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL no está definida.");

  const redirectUri = `${appUrl}/api/mercadolibre/auth/callback`;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });

  return `${ML_AUTH_BASE}/authorization?${params.toString()}`;
}
