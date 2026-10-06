import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listReviews, REVIEW_STATUSES } from "@/lib/services/reviews";
import { getMercadoLibreStatus } from "@/lib/services/mercadolibre";
import { runTool } from "../run-tool";
import type { McpContext } from "../context";
import { day, pageInput } from "./format";

const READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const;

export function registerSiteTools(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    "listar_opiniones",
    {
      title: "Opiniones del sitio",
      description:
        "Reseñas que dejaron los clientes en el sitio. Por defecto trae las pendientes de moderar " +
        "(se aprueban o rechazan desde el panel).",
      inputSchema: z.object({
        estado: z.enum(REVIEW_STATUSES).default("pending"),
        pagina: pageInput,
      }),
      annotations: READ_ONLY,
    },
    ({ estado, pagina }) =>
      runTool(ctx, "listar_opiniones", async () => {
        const { items, ...meta } = await listReviews(ctx, { page: pagina, status: estado });
        return {
          ...meta,
          opiniones: items.map((r) => ({
            id: r.id,
            nombre: r.name,
            estrellas: r.rating,
            opinion: r.content,
            estado: r.status,
            fecha: day(r.createdAt),
          })),
        };
      })
  );

  server.registerTool(
    "estado_mercadolibre",
    {
      title: "Estado de MercadoLibre",
      description:
        "Si la cuenta de MercadoLibre está conectada, cuántas publicaciones hay por estado, cuáles tienen error " +
        "y qué autos publicados en el sitio todavía no están en MercadoLibre.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    () => runTool(ctx, "estado_mercadolibre", () => getMercadoLibreStatus(ctx))
  );
}
