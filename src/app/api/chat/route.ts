import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { applyRateLimit, chatLimiter } from "@/lib/rate-limit";
import { runChatTurn } from "@/lib/chat/agent";
import { getChatContext } from "@/lib/chat/channel";
import { getChatModel } from "@/lib/chat/config";
import { CHAT_COPY } from "@/lib/chat/copy";
import { loadConversation, saveConversation, type Conversation } from "@/lib/chat/history";
import { openMcpBridge } from "@/lib/chat/mcp-bridge";
import { toPendingActionView } from "@/lib/chat/pending-actions";
import { addChatTokens, consumeChatMessage, getChatQuota } from "@/lib/chat/quota";
import { buildThreadContext } from "@/lib/chat/system-prompt";
import { toDisplayMessages } from "@/lib/chat/display";
import { chatMessageSchema } from "@/lib/validators/chat";

// Chat con IA del panel (add-on). Opera con las mismas tools del MCP.
//
// Ejemplo:
//   POST /api/chat
//   { "conversationId": "4f0c…" (opcional), "message": "cargale 150000 de detailing al corolla" }
// Response 200:
//   { "data": { "conversationId": "4f0c…", "reply": "Listo, cargué…",
//               "pendingActions": [{ "id": "…", "label": "Eliminar gasto", "description": "…", "destructive": true }],
//               "usage": { "used": 38, "limit": 300 } } }
// Errores: 403 sin add-on · 429 rate limit o cupo del mes agotado.
//
//   GET /api/chat?conversationId=4f0c…
// Response 200: { "data": { "usage": { "used": 38, "limit": 300 }, "messages": [{ "role": "user", "content": "…" }] } }

// Las tools tocan Prisma y Redis: runtime Node, nunca edge.
export const runtime = "nodejs";

export const GET = withLogger(async (request, { requestId }) => {
  const ctx = await getChatContext(request, requestId, "chat.usage");
  if (ctx instanceof NextResponse) return ctx;

  const quota = await getChatQuota(ctx);
  const conversationId = new URL(request.url).searchParams.get("conversationId");
  const conversation = conversationId ? await loadConversation(ctx, conversationId) : null;

  return NextResponse.json({
    data: {
      usage: { used: quota.used, limit: quota.limit },
      messages: conversation ? toDisplayMessages(conversation.messages) : [],
    },
  });
});

export const POST = withLogger(async (request, { requestId }) => {
  const ctx = await getChatContext(request, requestId, "chat.message");
  if (ctx instanceof NextResponse) return ctx;

  const userId = ctx.dealership.currentUser.clerkUserId;
  const rl = await applyRateLimit(chatLimiter, userId, requestId, { channel: "chat" });
  if (!rl.ok) {
    return NextResponse.json({ error: CHAT_COPY.errors.rateLimited }, { status: 429, headers: rl.headers });
  }

  const parsed = chatMessageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400, headers: rl.headers }
    );
  }

  const quota = await getChatQuota(ctx);
  if (!quota.ok) {
    logger.warn(requestId, "chat.quota_exceeded", { dealershipId: ctx.dealership.id, reason: quota.reason });
    const error = quota.reason === "tokens" ? CHAT_COPY.errors.quotaTokens : CHAT_COPY.errors.quotaMessages;
    return NextResponse.json({ error }, { status: 429, headers: rl.headers });
  }
  // Se cobra antes de llamar al modelo: un mensaje que falla a mitad igual costó.
  const used = (await consumeChatMessage(ctx)) ?? quota.used + 1;

  const existingId = parsed.data.conversationId;
  const existing = existingId ? await loadConversation(ctx, existingId) : null;
  const conversationId = existing && existingId ? existingId : randomUUID();
  const conversation: Conversation = existing ?? { threadContext: buildThreadContext(ctx), messages: [] };

  const startedAt = Date.now();
  const bridge = await openMcpBridge(ctx);
  try {
    const turn = await runChatTurn({ ctx, bridge, conversationId, conversation, userMessage: parsed.data.message });
    await saveConversation(ctx, conversationId, conversation);
    await addChatTokens(ctx, turn.usage.promptTokens + turn.usage.completionTokens);

    // Nunca el texto: tiene datos de clientes.
    logger.info(requestId, "chat.message.completed", {
      dealershipId: ctx.dealership.id,
      model: getChatModel(),
      toolCalls: turn.toolCalls,
      pendingActions: turn.pendingActions.length,
      promptTokens: turn.usage.promptTokens,
      completionTokens: turn.usage.completionTokens,
      costUsd: turn.usage.costUsd,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        data: {
          conversationId,
          reply: turn.reply,
          pendingActions: turn.pendingActions.map(toPendingActionView),
          usage: { used, limit: quota.limit },
        },
      },
      { headers: rl.headers }
    );
  } catch (error) {
    logger.error(requestId, "chat.message.failed", {
      dealershipId: ctx.dealership.id,
      model: getChatModel(),
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: CHAT_COPY.errors.generic, requestId }, { status: 502, headers: rl.headers });
  } finally {
    await bridge.close();
  }
});
