import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "@/lib/logger";
import { ServiceError } from "@/lib/services/service-error";
import { checkMcpQuota, consumeMcpQuota } from "./quota";
import type { McpContext } from "./context";

function textResult(text: string, isError = false): CallToolResult {
  return { content: [{ type: "text", text }], ...(isError ? { isError: true } : {}) };
}

/**
 * Envuelve la ejecución de una tool: cupo diario, traducción de errores y log.
 *
 * Los errores de negocio (`ServiceError`) vuelven como `isError` con el mensaje
 * en español: la IA se lo explica al usuario y puede corregir y reintentar. Un
 * error inesperado no filtra detalles internos, solo el requestId.
 *
 * El resultado es JSON: la IA lo lee mejor que una tabla en prosa.
 */
export async function runTool(
  ctx: McpContext,
  tool: string,
  run: () => Promise<unknown>
): Promise<CallToolResult> {
  const startedAt = Date.now();
  const meta = { tool, dealershipId: ctx.dealership.id };

  const quota = await checkMcpQuota(ctx);
  if (!quota.ok) {
    logger.warn(ctx.requestId, "mcp.tool.quota_exceeded", { ...meta, limit: quota.limit });
    return textResult(
      `Llegaste al límite de ${quota.limit} acciones por día de tu plan. ` +
        "Se renueva a la medianoche, o pasate al plan Media para usarlo sin límite diario.",
      true
    );
  }

  try {
    const payload = await run();
    await consumeMcpQuota(ctx);
    logger.info(ctx.requestId, "mcp.tool.called", { ...meta, ok: true, durationMs: Date.now() - startedAt });
    return textResult(JSON.stringify(payload, null, 2));
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    if (error instanceof ServiceError) {
      logger.info(ctx.requestId, "mcp.tool.called", { ...meta, ok: false, code: error.code, durationMs });
      return textResult(error.message, true);
    }
    logger.error(ctx.requestId, "mcp.tool.failed", {
      ...meta,
      durationMs,
      error: error instanceof Error ? error.message : String(error),
    });
    return textResult(`Error interno. Si se repite, contactá a soporte con el código ${ctx.requestId}.`, true);
  }
}
