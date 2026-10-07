import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { convertAmount } from "@/lib/margin";
import { getBusinessSummary } from "@/lib/services/insights/business-summary";
import { getStaleStock } from "@/lib/services/insights/stale-stock";
import { getDealerUsdRate } from "@/lib/services/insights/exchange";
import { runTool } from "../run-tool";
import type { McpContext } from "../context";

const READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const;

export function registerInsightTools(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    "resumen_negocio",
    {
      title: "Resumen del negocio",
      description:
        "Ventas completadas, facturación y ganancia neta (por moneda, sin mezclar pesos con dólares), consultas " +
        "recibidas y estado del stock en los últimos N días. Para preguntas como '¿cómo vengo este mes?'.",
      inputSchema: z.object({
        dias: z.number().int().min(1).max(365).default(30).describe("Período hacia atrás desde hoy. Ej: 30, 90."),
      }),
      annotations: READ_ONLY,
    },
    ({ dias }) => runTool(ctx, "resumen_negocio", () => getBusinessSummary(ctx, dias))
  );

  server.registerTool(
    "stock_inmovilizado",
    {
      title: "Stock inmovilizado",
      description:
        "Autos disponibles que llevan publicados N días o más sin venderse, del más viejo al más nuevo, con las " +
        "consultas que recibieron y lo gastado en cada uno. Útil para decidir a cuáles bajarles el precio.",
      inputSchema: z.object({
        dias_minimos: z.number().int().min(1).max(365).default(60),
      }),
      annotations: READ_ONLY,
    },
    ({ dias_minimos }) => runTool(ctx, "stock_inmovilizado", () => getStaleStock(ctx, dias_minimos))
  );

  server.registerTool(
    "cotizacion_dolar",
    {
      title: "Cotización del dólar",
      description:
        "Cotización de trabajo del concesionario (oficial BCRA + su spread). Si mandás monto y moneda, lo " +
        "convierte: USD a ARS o ARS a USD.",
      inputSchema: z.object({
        monto: z.number().positive().optional(),
        moneda: z.enum(["ARS", "USD"]).optional().describe("Moneda del monto a convertir."),
      }),
      annotations: READ_ONLY,
    },
    ({ monto, moneda }) =>
      runTool(ctx, "cotizacion_dolar", async () => {
        const rate = await getDealerUsdRate(ctx);
        if (!rate) return { mensaje: "No hay cotización disponible en este momento." };
        const target = moneda === "USD" ? "ARS" : "USD";
        const converted = monto && moneda ? convertAmount(monto, moneda, target, rate.effective) : null;
        return {
          oficialBCRA: rate.base,
          spreadConcesionario: rate.spread,
          cotizacionDeTrabajo: rate.effective,
          fecha: rate.date,
          ...(converted !== null
            ? { conversion: { monto, moneda, resultado: Math.round(converted * 100) / 100, monedaResultado: target } }
            : {}),
        };
      })
  );
}
