import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getDashboardContext } from "@/lib/services/dashboard-context";
import type { McpContext } from "@/lib/mcp/context";
import { isChatEnabled } from "./config";
import { CHAT_COPY } from "./copy";

/**
 * Adaptador del canal chat: sesión de Clerk del panel (como el dashboard) +
 * interruptor global + add-on contratado. Devuelve un `NextResponse` si no se
 * puede usar, para cortar con `return`.
 */
export async function getChatContext(
  request: Request,
  requestId: string,
  event: string
): Promise<McpContext | NextResponse> {
  if (!isChatEnabled()) {
    return NextResponse.json({ error: CHAT_COPY.errors.disabled }, { status: 404 });
  }

  const ctx = await getDashboardContext(requestId, event);
  if (ctx instanceof NextResponse) return ctx;

  if (ctx.dealership.aiChatMonthlyMessages <= 0) {
    logger.info(requestId, `${event}.not_contracted`, { dealershipId: ctx.dealership.id });
    return NextResponse.json({ error: CHAT_COPY.errors.notContracted }, { status: 403 });
  }

  return { ...ctx, source: "chat", appOrigin: new URL(request.url).origin };
}
