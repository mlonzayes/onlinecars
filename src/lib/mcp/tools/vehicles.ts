import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createVehicle, getVehicle, listVehicles, updateVehicle } from "@/lib/services/vehicles";
import { runTool } from "../run-tool";
import { panelVehicleUrl, type McpContext } from "../context";
import { toVehicleListItem, toVehicleView } from "./vehicle-view";
import {
  createVehicleToolSchema,
  searchVehiclesToolSchema,
  updateVehicleToolSchema,
  vehicleIdToolSchema,
} from "./vehicle-schemas";

const PAGE_SIZE = 20;

export function registerVehicleTools(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    "buscar_vehiculos",
    {
      title: "Buscar vehículos",
      description:
        `Lista el stock del concesionario, de a ${PAGE_SIZE}, del más nuevo al más viejo. ` +
        "Usala para encontrar el ID de un vehículo antes de verlo, editarlo o cargarle gastos.",
      inputSchema: searchVehiclesToolSchema,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ texto, estado, pagina }) =>
      runTool(ctx, "buscar_vehiculos", async () => {
        const { items, total } = await listVehicles(ctx, {
          page: pagina,
          limit: PAGE_SIZE,
          status: estado,
          search: texto?.trim() || undefined,
        });
        return {
          total,
          pagina,
          totalPaginas: Math.ceil(total / PAGE_SIZE),
          vehiculos: items.map((v) => toVehicleListItem(ctx, v)),
        };
      })
  );

  server.registerTool(
    "ver_vehiculo",
    {
      title: "Ver vehículo",
      description: "Devuelve todos los datos de un vehículo, con link al panel y al sitio público si está publicado.",
      inputSchema: vehicleIdToolSchema,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ vehiculo_id }) =>
      runTool(ctx, "ver_vehiculo", async () => {
        const vehicle = await getVehicle(ctx, vehiculo_id);
        return { ...toVehicleView(ctx, vehicle), cantidadFotos: vehicle.images.length };
      })
  );

  server.registerTool(
    "crear_vehiculo",
    {
      title: "Cargar vehículo",
      description:
        "Carga un vehículo nuevo al stock como BORRADOR: no aparece en el sitio hasta que el usuario lo publique " +
        "desde el panel. Antes de crearlo, confirmá con el usuario marca, modelo, año, precio y moneda. " +
        "Las fotos se suben desde el link del panel que devuelve esta tool.",
      inputSchema: createVehicleToolSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    (input) =>
      runTool(ctx, "crear_vehiculo", async () => {
        // La IA no decide estado ni destacado: arranca como el alta del panel.
        const vehicle = await createVehicle(ctx, {
          ...input,
          status: "available",
          featured: false,
          unlimitedStock: false,
        });
        return {
          mensaje: "Vehículo cargado como borrador. Subí las fotos y publicalo desde el panel.",
          vehiculo: toVehicleView(ctx, vehicle),
          linkFotos: panelVehicleUrl(ctx, vehicle.id),
        };
      })
  );

  server.registerTool(
    "actualizar_vehiculo",
    {
      title: "Editar vehículo",
      description:
        "Modifica uno o más datos de un vehículo (precio, km, descripción, etc.). Mandá SOLO los campos que " +
        "cambian: lo que no mandes queda como está. No se puede editar si tiene una venta en curso.",
      inputSchema: updateVehicleToolSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    ({ vehiculo_id, ...changes }) =>
      runTool(ctx, "actualizar_vehiculo", async () => {
        const vehicle = await updateVehicle(ctx, vehiculo_id, changes);
        return { mensaje: "Vehículo actualizado.", vehiculo: toVehicleView(ctx, vehicle) };
      })
  );
}
