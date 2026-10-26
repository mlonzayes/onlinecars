import OpenAI from "openai";
import { CHAT_COPY } from "./copy";

// Qué hacer cuando falla la llamada al modelo. Nunca 502/504: Cloudflare
// reemplaza esas respuestas del origen por su página de "Bad gateway" y el
// panel no llega a leer el mensaje. 503 pasa tal cual.

export interface ChatFailure {
  status: number;
  // Lo que ve el dealer. No le mostramos detalles de configuración.
  message: string;
  // Para el log: el status y el mensaje que devolvió OpenRouter.
  providerStatus: number | null;
  reason: "model_unavailable" | "provider_busy" | "provider_config" | "unexpected";
}

export function describeChatFailure(error: unknown): ChatFailure {
  if (error instanceof OpenAI.APIError) {
    const providerStatus = error.status ?? null;
    // 404: el modelo no existe o ningún proveedor lo puede servir (típico de
    // los gratis con data_collection: "deny"). 400: parámetro no soportado.
    if (providerStatus === 404 || providerStatus === 400) {
      return { status: 503, message: CHAT_COPY.errors.modelUnavailable, providerStatus, reason: "model_unavailable" };
    }
    if (providerStatus === 429 || (providerStatus !== null && providerStatus >= 500)) {
      return { status: 503, message: CHAT_COPY.errors.providerBusy, providerStatus, reason: "provider_busy" };
    }
    // 401 key inválida, 402 sin créditos, 403 límite de gasto: son nuestros.
    return { status: 503, message: CHAT_COPY.errors.modelUnavailable, providerStatus, reason: "provider_config" };
  }
  return { status: 500, message: CHAT_COPY.errors.generic, providerStatus: null, reason: "unexpected" };
}
