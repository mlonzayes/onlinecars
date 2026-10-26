import type OpenAI from "openai";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";
import type { ServiceContext } from "@/lib/services/context";
import { CHAT_LIMITS } from "./config";

// Conversación efímera en Redis, del lado del server. El cliente solo manda
// `conversationId` + el texto nuevo: no puede inyectar historial ni resultados
// de tools falsos. La key incluye dealer y usuario, así que un id ajeno no
// encuentra nada.

export type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export interface Conversation {
  // Contexto del hilo (dealer, fecha). Se fija al crearlo y no se recorta.
  threadContext: string;
  messages: ChatMessage[];
}

function conversationKey(ctx: ServiceContext, conversationId: string): string {
  return `chat:conv:${ctx.dealership.id}:${ctx.dealership.currentUser.clerkUserId}:${conversationId}`;
}

export async function loadConversation(
  ctx: ServiceContext,
  conversationId: string
): Promise<Conversation | null> {
  try {
    return await redis.get<Conversation>(conversationKey(ctx, conversationId));
  } catch (error) {
    // Fail-open: sin historial el chat sigue andando, solo pierde contexto.
    logger.warn(ctx.requestId, "chat.history.read_failed", {
      dealershipId: ctx.dealership.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Se queda con los últimos N mensajes, empezando SIEMPRE por uno del usuario:
 * cortar en el medio deja un resultado de tool sin su llamada y la API lo
 * rechaza.
 */
export function trimHistory(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= CHAT_LIMITS.maxHistoryMessages) return messages;
  let start = messages.length - CHAT_LIMITS.maxHistoryMessages;
  while (start < messages.length && messages[start].role !== "user") start++;
  return messages.slice(start);
}

export async function saveConversation(
  ctx: ServiceContext,
  conversationId: string,
  conversation: Conversation
): Promise<void> {
  try {
    await redis.set(
      conversationKey(ctx, conversationId),
      { ...conversation, messages: trimHistory(conversation.messages) },
      { ex: CHAT_LIMITS.conversationTtlSeconds }
    );
  } catch (error) {
    logger.warn(ctx.requestId, "chat.history.write_failed", {
      dealershipId: ctx.dealership.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
