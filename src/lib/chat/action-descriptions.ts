import { VEHICLE_EXPENSE_CATEGORY_LABELS, type VehicleExpenseCategory } from "@/lib/constants";
import { canEditCosts } from "@/lib/permissions";
import { listExpenses } from "@/lib/services/expenses";
import { getVehicle } from "@/lib/services/vehicles";
import type { ServiceContext } from "@/lib/services/context";
import { formatVehiclePrice } from "@/lib/tenant-format";
import { CHAT_COPY } from "./copy";
import { describeVehicleChanges } from "./vehicle-diff";

// Lo que dice la tarjeta de confirmación de cada tool que escribe. Se arma con
// datos REALES de la DB (no con lo que dijo el modelo), así el usuario ve qué
// va a pasar aunque el modelo haya sido engañado por un texto de terceros.
//
// Falla cerrado: una tool que escribe y no tiene descriptor acá NO se puede
// dejar pendiente. Tool nueva del MCP con escritura → sumar su descriptor.

type Args = Record<string, unknown>;
interface ActionDescription {
  label: string;
  description: string;
}
type Describer = (ctx: ServiceContext, args: Args) => Promise<ActionDescription>;

const str = (value: unknown) => (value === undefined || value === null ? "" : String(value));

function expenseCategory(value: unknown): string {
  return VEHICLE_EXPENSE_CATEGORY_LABELS[value as VehicleExpenseCategory] ?? str(value);
}

const DESCRIBERS: Record<string, Describer> = {
  async crear_vehiculo(_ctx, args) {
    const km = typeof args.kilometers === "number" ? ` · ${args.kilometers.toLocaleString("es-AR")} km` : "";
    return {
      label: CHAT_COPY.actions.createVehicle,
      description: `${str(args.title)} · ${str(args.year)} · ${formatVehiclePrice(args.price, str(args.currency) || "ARS")}${km}\n${CHAT_COPY.actions.draftNote}`,
    };
  },

  async actualizar_vehiculo(ctx, args) {
    const vehicle = await getVehicle(ctx, str(args.vehiculo_id));
    const { vehiculo_id: _id, ...changes } = args;
    const lines = describeVehicleChanges(vehicle, changes, canEditCosts(ctx.dealership.currentUser));
    if (lines.length === 0) throw new Error(CHAT_COPY.actions.noChanges);
    return { label: CHAT_COPY.actions.updateVehicle, description: [vehicle.title, ...lines].join("\n") };
  },

  async cargar_gasto(ctx, args) {
    const vehicle = await getVehicle(ctx, str(args.vehiculo_id));
    const amount = formatVehiclePrice(args.amount, str(args.currency) || "ARS");
    const detail = args.description ? ` (${str(args.description)})` : "";
    return {
      label: CHAT_COPY.actions.createExpense,
      description: `${expenseCategory(args.category)}${detail}: ${amount} · ${vehicle.title}`,
    };
  },

  async eliminar_gasto(ctx, args) {
    const vehicleId = str(args.vehiculo_id);
    const [vehicle, expenses] = await Promise.all([getVehicle(ctx, vehicleId), listExpenses(ctx, vehicleId)]);
    const expense = expenses.find((e) => e.id === args.gasto_id);
    if (!expense) throw new Error("Ese gasto no existe en este vehículo.");
    const detail = expense.description ? ` (${expense.description})` : "";
    return {
      label: CHAT_COPY.actions.deleteExpense,
      description: `${expenseCategory(expense.category)}${detail}: ${formatVehiclePrice(expense.amount, expense.currency)} · ${vehicle.title}`,
    };
  },

  async publicar_vehiculo(ctx, args) {
    const vehicle = await getVehicle(ctx, str(args.vehiculo_id));
    const publish = args.publicar !== false;
    return {
      label: publish ? CHAT_COPY.actions.publish : CHAT_COPY.actions.unpublish,
      description: `${vehicle.title} · ${formatVehiclePrice(vehicle.price, vehicle.currency)}`,
    };
  },
};

/** Describe la acción con datos reales. Tira si la tool no tiene descriptor o el recurso no existe. */
export async function describeAction(ctx: ServiceContext, tool: string, args: Args): Promise<ActionDescription> {
  const describer = DESCRIBERS[tool];
  if (!describer) throw new Error(CHAT_COPY.actions.unsupported);
  return describer(ctx, args);
}
