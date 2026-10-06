import type { ServiceContext } from "@/lib/services/context";

/** Contexto de una request al MCP: el de los servicios + datos del canal. */
export interface McpContext extends ServiceContext {
  source: "mcp";
  // Origen del panel (mismo host que /api/mcp) para armar links al dashboard.
  appOrigin: string;
}

export function panelVehicleUrl(ctx: McpContext, vehicleId: string): string {
  return `${ctx.appOrigin}/dashboard/vehiculos/${vehicleId}`;
}
