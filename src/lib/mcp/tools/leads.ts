import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { LEAD_SOURCES, LEAD_STATUSES } from "@/lib/constants";
import { getLead, listLeads, type LeadRow } from "@/lib/services/leads";
import { runTool } from "../run-tool";
import type { McpContext } from "../context";
import { day, pageInput } from "./format";

const READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const;

function toLeadView(lead: LeadRow) {
  return {
    id: lead.id,
    nombre: lead.name,
    telefono: lead.phone,
    email: lead.email,
    mensaje: lead.message,
    origen: lead.source,
    estado: lead.status,
    fecha: day(lead.createdAt),
    vehiculo: lead.vehicle
      ? { id: lead.vehicle.id, titulo: lead.vehicle.title, anio: lead.vehicle.year, patente: lead.vehicle.licensePlate }
      : null,
    // Solo en tasaciones: el auto que el cliente quiere vender.
    datosTasacion: lead.quoteData ?? null,
  };
}

export function registerLeadTools(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    "listar_leads",
    {
      title: "Listar consultas (leads)",
      description:
        "Consultas recibidas del sitio, WhatsApp, MercadoLibre o pedidos de tasación, de la más nueva a la más vieja. " +
        "Estados: new = sin contestar, contacted = contactado, qualified = interesado, closed = cerrado.",
      inputSchema: z.object({
        estado: z.enum(LEAD_STATUSES).optional(),
        origen: z.enum(LEAD_SOURCES).optional(),
        vehiculo_id: z.string().optional().describe("Solo consultas por este vehículo."),
        texto: z.string().max(100).optional().describe("Busca por nombre, teléfono, email o vehículo."),
        ultimos_dias: z.number().int().min(1).max(365).optional(),
        pagina: pageInput,
      }),
      annotations: READ_ONLY,
    },
    (input) =>
      runTool(ctx, "listar_leads", async () => {
        const { items, ...meta } = await listLeads(ctx, {
          page: input.pagina,
          status: input.estado,
          source: input.origen,
          vehicleId: input.vehiculo_id,
          search: input.texto,
          lastDays: input.ultimos_dias,
        });
        return { ...meta, consultas: items.map(toLeadView) };
      })
  );

  server.registerTool(
    "ver_lead",
    {
      title: "Ver consulta",
      description: "Detalle completo de una consulta, con datos de contacto y el vehículo por el que preguntó.",
      inputSchema: z.object({ lead_id: z.string().min(1) }),
      annotations: READ_ONLY,
    },
    ({ lead_id }) => runTool(ctx, "ver_lead", async () => toLeadView(await getLead(ctx, lead_id)))
  );
}
