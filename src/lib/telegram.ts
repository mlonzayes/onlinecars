/**
 * Notificaciones via Telegram Bot API.
 *
 * Setup (una sola vez):
 *   1. Hablale a @BotFather en Telegram → /newbot → te da un TOKEN
 *   2. Hablale a tu bot recién creado (mandale /start)
 *   3. Para sacar el chat_id: visitá https://api.telegram.org/bot<TOKEN>/getUpdates
 *      y buscá "chat":{"id": ...} en el JSON
 *   4. Cargá en env:
 *        TELEGRAM_BOT_TOKEN=<el token>
 *        TELEGRAM_CHAT_ID=<el chat_id>
 *
 * Diseño:
 *   - Fail-open: si las env vars no están seteadas, no rompe el flow del caller.
 *     Solo loggea y devuelve. La notificación es ÚTIL pero no esencial.
 *   - Best-effort: si la API de Telegram falla, no afecta el guardado de la
 *     waitlist entry (etc). El caller no tiene que catchear.
 */

import { logger } from "./logger";

const TELEGRAM_API = "https://api.telegram.org";

interface SendTelegramOpts {
  text: string;
  // Parse mode opcional. Default: "HTML" — permite <b>, <i>, <a href="">, etc.
  // sin tener que escapar markdown stricter.
  parseMode?: "HTML" | "MarkdownV2" | "Markdown";
}

/**
 * Manda un mensaje a tu chat de Telegram configurado.
 * Nunca tira excepciones — siempre devuelve un boolean indicando si se envió.
 */
export async function sendTelegramNotification(
  opts: SendTelegramOpts,
  requestId?: string
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    logger.warn(requestId, "telegram.skipped", { reason: "missing_env" });
    return false;
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: opts.text,
        parse_mode: opts.parseMode ?? "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "<no body>");
      logger.error(requestId, "telegram.send_failed", {
        status: res.status,
        error: errorText.slice(0, 300),
      });
      return false;
    }

    return true;
  } catch (err) {
    logger.error(requestId, "telegram.send_exception", {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

/**
 * Escapa caracteres especiales de HTML en strings que vienen del user.
 * Telegram con parse_mode=HTML interpreta `<`, `>`, `&` y rompe si vienen
 * sin escapar — ej: si el nombre del dealer tiene "<", el mensaje no se manda.
 */
export function escapeTelegramHTML(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
