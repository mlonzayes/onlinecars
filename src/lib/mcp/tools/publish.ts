import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getVehicle, setVehiclePublished } from "@/lib/services/vehicles";
import { runTool } from "../run-tool";
import { panelVehicleUrl, type McpContext } from "../context";
import { toVehicleView } from "./vehicle-view";
import { vehicleIdToolSchema } from "./vehicle-schemas";

const publishToolSchema = vehicleIdToolSchema.extend({
  publicar: z
    .boolean()
    .default(true)
    .describe("true = publicar en el sitio; false = despublicar (vuelve a borrador)."),
});

export function registerPublishTools(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    "publicar_vehiculo",
    {
      title: "Publicar o despublicar vehículo",
      description:
        "Publica un vehículo en el sitio del concesionario (o lo despublica). Antes de publicar, confirmá con el " +
        "usuario que los datos y el precio son correctos. Si el auto no tiene fotos, avisale: se publica igual, " +
        "pero sin fotos vende mucho menos. Respeta el límite de vehículos publicados del plan.",
      inputSchema: publishToolSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    ({ vehiculo_id, publicar }) =>
      runTool(ctx, "publicar_vehiculo", async () => {
        await setVehiclePublished(ctx, vehiculo_id, publicar);
        const vehicle = await getVehicle(ctx, vehiculo_id);
        const sinFotos = vehicle.images.length === 0;
        return {
          mensaje: publicar ? "Vehículo publicado en el sitio." : "Vehículo despublicado.",
          ...(publicar && sinFotos
            ? { advertencia: `No tiene fotos. Subilas desde ${panelVehicleUrl(ctx, vehicle.id)}` }
            : {}),
          vehiculo: toVehicleView(ctx, vehicle),
        };
      })
  );
}
