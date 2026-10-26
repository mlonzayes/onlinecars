import type { ServiceContext } from "@/lib/services/context";

/**
 * Contexto de una request al MCP: el de los servicios + datos del canal.
 *
 * `source: "chat"` es el chat del panel, que usa este mismo server en memoria
 * (ver src/lib/chat/mcp-bridge.ts). Cobra por mensaje, no por tool.
 */
export interface McpContext extends ServiceContext {
  source: "mcp" | "chat";
  // Origen del panel (mismo host que /api/mcp) para armar links al dashboard.
  appOrigin: string;
}

export function panelVehicleUrl(ctx: McpContext, vehicleId: string): string {
  return `${ctx.appOrigin}/dashboard/vehiculos/${vehicleId}`;
}
