import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { VEHICLE_EXPENSE_CATEGORIES, VEHICLE_EXPENSE_CATEGORY_LABELS } from "@/lib/constants";
import { vehicleExpenseCreateSchema } from "@/lib/validators/vehicle-expense";
import { getVehicle } from "@/lib/services/vehicles";
import { createExpense, deleteExpense, listExpenses } from "@/lib/services/expenses";
import { runTool } from "../run-tool";
import type { McpContext } from "../context";
import { computeVehicleProfit } from "./vehicle-profit";
import { vehicleIdToolSchema } from "./vehicle-schemas";

const CATEGORY_GUIDE = VEHICLE_EXPENSE_CATEGORIES.map(
  (c) => `${c} (${VEHICLE_EXPENSE_CATEGORY_LABELS[c]})`
).join(", ");

const createExpenseToolSchema = vehicleExpenseCreateSchema.extend({
  vehiculo_id: vehicleIdToolSchema.shape.vehiculo_id,
  category: vehicleExpenseCreateSchema.shape.category.describe(
    `Categoría del gasto: ${CATEGORY_GUIDE}. Un detailing o lavado va en pulido; si no encaja, otros.`
  ),
  amount: vehicleExpenseCreateSchema.shape.amount.describe("Monto como número, sin puntos. Ej: 150000."),
  description: z
    .string()
    .max(2000)
    .optional()
    .describe(
      "Detalle del gasto, lo más completo posible con lo que dijo el usuario: proveedor o taller, qué se hizo, " +
        "piezas, garantía, número de factura. Es lo que después explica la ganancia del auto."
    ),
  date: z.string().date().optional().describe("Fecha del gasto (YYYY-MM-DD). Si no se aclara, hoy."),
});

export function registerExpenseTools(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    "cargar_gasto",
    {
      title: "Cargar gasto de un vehículo",
      description:
        "Registra un gasto de un vehículo (detailing, mecánica, transferencia, repuestos, etc.). Se descuenta de " +
        "la ganancia neta del auto. Solo administradores. Si el usuario no dijo la moneda, son pesos (ARS).",
      inputSchema: createExpenseToolSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    ({ vehiculo_id, date, ...input }) =>
      runTool(ctx, "cargar_gasto", async () => {
        const expense = await createExpense(ctx, vehiculo_id, {
          ...input,
          ...(date ? { date: new Date(`${date}T12:00:00`) } : {}),
        });
        return { mensaje: "Gasto cargado.", gastoId: expense.id };
      })
  );

  server.registerTool(
    "ver_costos_vehiculo",
    {
      title: "Ver costos y ganancia de un vehículo",
      description:
        "Devuelve precio de compra, todos los gastos con su detalle, el total y la ganancia neta del vehículo " +
        "(sobre la venta real si ya se vendió, o estimada sobre el precio publicado).",
      inputSchema: vehicleIdToolSchema,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ vehiculo_id }) =>
      runTool(ctx, "ver_costos_vehiculo", async () => {
        const expenses = await listExpenses(ctx, vehiculo_id);
        const vehicle = await getVehicle(ctx, vehiculo_id);
        return {
          vehiculo: vehicle.title,
          precioCompra: vehicle.costPrice?.toString() ?? null,
          monedaCompra: vehicle.costCurrency,
          gastos: expenses.map((e) => ({
            id: e.id,
            categoria: VEHICLE_EXPENSE_CATEGORY_LABELS[e.category as keyof typeof VEHICLE_EXPENSE_CATEGORY_LABELS] ?? e.category,
            detalle: e.description,
            monto: e.amount,
            moneda: e.currency,
            fecha: e.date.slice(0, 10),
          })),
          rentabilidad: await computeVehicleProfit(ctx, vehicle, expenses),
        };
      })
  );

  server.registerTool(
    "eliminar_gasto",
    {
      title: "Eliminar gasto",
      description: "Borra un gasto cargado por error. Pedile confirmación al usuario antes. Solo administradores.",
      inputSchema: vehicleIdToolSchema.extend({
        gasto_id: z.string().min(1).describe("ID del gasto (sale de ver_costos_vehiculo)."),
      }),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    ({ vehiculo_id, gasto_id }) =>
      runTool(ctx, "eliminar_gasto", async () => {
        await deleteExpense(ctx, vehiculo_id, gasto_id);
        return { mensaje: "Gasto eliminado." };
      })
  );
}
