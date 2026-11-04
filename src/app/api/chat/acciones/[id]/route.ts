import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { getChatContext } from "@/lib/chat/channel";
import { CHAT_COPY } from "@/lib/chat/copy";
import { loadConversation, saveConversation } from "@/lib/chat/history";
import { openMcpBridge, toolResultText } from "@/lib/chat/mcp-bridge";
import { takePendingAction } from "@/lib/chat/pending-actions";
import { chatActionDecisionSchema } from "@/lib/validators/chat";

// Confirma o cancela una acción que el chat dejó pendiente (borrar, publicar).
// La ejecuta con la misma tool del MCP, así que pasa por los mismos permisos y
// guards que si la hubiera hecho el modelo.
//
// Ejemplo:
//   POST /api/chat/acciones/9b1e…   { "decision": "confirm" }
// Response 200: { "data": { "ok": true, "message": "Gasto eliminado." } }
// Response 200 (error de negocio): { "data": { "ok": false, "message": "Tu usuario no tiene permiso…" } }
// Response 404: la acción venció, ya se usó o no es de este usuario.

export const runtime = "nodejs";

type RouteParams = { id: string };

// La tool devuelve JSON con un `mensaje` para el usuario; si no, un texto genérico.
// Al cargar un auto suma el link para subir las fotos, que si no se pierde.
function resultMessage(text: string): string {
  try {
    const parsed = JSON.parse(text) as { mensaje?: unknown; linkFotos?: unknown };
    if (typeof parsed.mensaje !== "string") return CHAT_COPY.confirmed;
    return typeof parsed.linkFotos === "string" ? `${parsed.mensaje} ${parsed.linkFotos}` : parsed.mensaje;
  } catch {
    return CHAT_COPY.confirmed;
  }
}

export const POST = withLogger<RouteParams>(async (request, { requestId, params }) => {
  const ctx = await getChatContext(request, requestId, "chat.action");
  if (ctx instanceof NextResponse) return ctx;

  const parsed = chatActionDecisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const action = await takePendingAction(ctx, params.id);
  if (!action) return NextResponse.json({ error: CHAT_COPY.actionExpired }, { status: 404 });

  let ok = true;
  let message: string = CHAT_COPY.cancelled;

  if (parsed.data.decision === "confirm") {
    const bridge = await openMcpBridge(ctx);
    try {
      const result = await bridge.callTool(action.tool, action.args);
      const text = toolResultText(result);
      ok = !result.isError;
      message = ok ? resultMessage(text) : text;
    } finally {
      await bridge.close();
    }
  }

  logger.info(requestId, "chat.action.resolved", {
    dealershipId: ctx.dealership.id,
    tool: action.tool,
    decision: parsed.data.decision,
    ok,
    // Cuántos avisos de cambio sensible tenía: un confirm con avisos es lo que
    // hay que mirar si aparece un precio regalado o un teléfono ajeno.
    warnings: action.warnings?.length ?? 0,
  });

  // Se anota en el historial para que el modelo sepa qué pasó con lo pendiente.
  const conversation = await loadConversation(ctx, action.conversationId);
  if (conversation) {
    conversation.messages.push({ role: "assistant", content: `${action.label} (${action.description}): ${message}` });
    await saveConversation(ctx, action.conversationId, conversation);
  }

  return NextResponse.json({ data: { ok, message } });
});
