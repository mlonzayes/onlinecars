import { NextResponse } from "next/server";
import { getAccountBlockReason } from "@/lib/account-status";
import { logger } from "@/lib/logger";
import { isSameOriginRequest } from "@/lib/security/same-origin";
import { getDashboardContext } from "@/lib/services/dashboard-context";
import type { McpContext } from "@/lib/mcp/context";
import { isChatEnabled } from "./config";
import { CHAT_COPY } from "./copy";

/**
 * Adaptador del canal chat: sesión de Clerk del panel (como el dashboard) +
 * interruptor global + add-on contratado + cuenta activa. Devuelve un
 * `NextResponse` si no se puede usar, para cortar con `return`.
 */
export async function getChatContext(
  request: Request,
  requestId: string,
  event: string
): Promise<McpContext | NextResponse> {
  if (!isChatEnabled()) {
    return NextResponse.json({ error: CHAT_COPY.errors.disabled }, { status: 404 });
  }

  // Un POST al chat puede escribir: solo se acepta desde el panel (ver same-origin.ts).
  if (request.method !== "GET" && !isSameOriginRequest(request)) {
    logger.warn(requestId, `${event}.cross_origin`, { origin: request.headers.get("origin") });
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }

  const ctx = await getDashboardContext(requestId, event);
  if (ctx instanceof NextResponse) return ctx;

  if (ctx.dealership.aiChatMonthlyMessages <= 0) {
    logger.info(requestId, `${event}.not_contracted`, { dealershipId: ctx.dealership.id });
    return NextResponse.json({ error: CHAT_COPY.errors.notContracted }, { status: 403 });
  }

  // Las tools ya lo chequean, pero el modelo se paga igual: se corta antes.
  const blockReason = getAccountBlockReason(ctx.dealership);
  if (blockReason) {
    logger.info(requestId, `${event}.account_blocked`, { dealershipId: ctx.dealership.id, reason: blockReason });
    const error = blockReason === "suspended" ? CHAT_COPY.errors.accountSuspended : CHAT_COPY.errors.accountExpired;
    return NextResponse.json({ error }, { status: 403 });
  }

  return { ...ctx, source: "chat", appOrigin: new URL(request.url).origin };
}
