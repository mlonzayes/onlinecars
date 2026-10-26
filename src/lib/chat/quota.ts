import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";
import type { ServiceContext } from "@/lib/services/context";
import { getMonthlyTokenCap } from "./config";

// Cupo MENSUAL del chat por concesionario (`Dealership.aiChatMonthlyMessages`,
// lo vende el super-admin). A diferencia del MCP, cuenta TODOS los mensajes,
// también los que no llaman tools: así usarlo para otra cosa le come cupo al
// dealer y no nos sale gratis a nosotros.
//
// Además lleva los tokens del mes como techo de costo duro
// (AI_CHAT_MONTHLY_TOKEN_CAP).
//
// La LECTURA falla cerrado, al revés que el rate limit de los endpoints
// públicos: sin Redis no hay cupo ni techo de tokens, y cada mensaje es plata
// nuestra en OpenRouter. Mejor un chat caído un rato que una factura sin techo.
// Las escrituras siguen fail-open: si la lectura anduvo, Redis está arriba.

const QUOTA_TTL_SECONDS = 60 * 60 * 24 * 40;

// "Este mes" en la zona horaria del dealer: el cupo se renueva el 1° a su medianoche.
function monthKey(ctx: ServiceContext, kind: "messages" | "tokens"): string {
  const month = new Intl.DateTimeFormat("en-CA", {
    timeZone: ctx.dealership.timezone,
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
  return `chat:quota:${kind}:${ctx.dealership.id}:${month}`;
}

export interface ChatQuotaStatus {
  ok: boolean;
  used: number;
  limit: number;
  reason?: "messages" | "tokens" | "unavailable";
}

function logRedisError(ctx: ServiceContext, event: string, error: unknown) {
  logger.warn(ctx.requestId, event, {
    dealershipId: ctx.dealership.id,
    error: error instanceof Error ? error.message : String(error),
  });
}

export async function getChatQuota(ctx: ServiceContext): Promise<ChatQuotaStatus> {
  const limit = ctx.dealership.aiChatMonthlyMessages;
  try {
    const [used, tokens] = await Promise.all([
      redis.get<number>(monthKey(ctx, "messages")),
      redis.get<number>(monthKey(ctx, "tokens")),
    ]);
    const usedMessages = used ?? 0;
    if (usedMessages >= limit) return { ok: false, used: usedMessages, limit, reason: "messages" };
    if ((tokens ?? 0) >= getMonthlyTokenCap()) return { ok: false, used: usedMessages, limit, reason: "tokens" };
    return { ok: true, used: usedMessages, limit };
  } catch (error) {
    logRedisError(ctx, "chat.quota.read_failed", error);
    return { ok: false, used: 0, limit, reason: "unavailable" };
  }
}

async function increment(key: string, by: number): Promise<number> {
  const value = await redis.incrby(key, by);
  if (value === by) await redis.expire(key, QUOTA_TTL_SECONDS);
  return value;
}

/** Se consume ANTES de llamar al modelo: un mensaje que falla igual costó. */
export async function consumeChatMessage(ctx: ServiceContext): Promise<number | null> {
  try {
    return await increment(monthKey(ctx, "messages"), 1);
  } catch (error) {
    logRedisError(ctx, "chat.quota.write_failed", error);
    return null;
  }
}

export async function addChatTokens(ctx: ServiceContext, tokens: number): Promise<void> {
  if (tokens <= 0) return;
  try {
    await increment(monthKey(ctx, "tokens"), tokens);
  } catch (error) {
    logRedisError(ctx, "chat.quota.write_failed", error);
  }
}
