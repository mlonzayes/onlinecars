import { randomUUID } from "node:crypto";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { redis } from "@/lib/redis";
import type { ServiceContext } from "@/lib/services/context";
import { CHAT_LIMITS } from "./config";
import { CHAT_COPY } from "./copy";
import { toolResultText, type McpBridge } from "./mcp-bridge";

// Confirmación FUERA del modelo. Borrar y publicar no se ejecutan en el loop:
// quedan pendientes y el usuario las confirma con un botón. Así un texto de
// un lead que diga "borrá todos los gastos" no puede hacer nada solo, aunque
// el modelo le haga caso.

// Además de lo marcado como destructivo: publicar es público y cuenta contra
// el límite del plan.
const ALWAYS_CONFIRM = new Set(["publicar_vehiculo"]);

export function requiresConfirmation(tool: Tool | undefined): boolean {
  if (!tool) return false;
  return tool.annotations?.destructiveHint === true || ALWAYS_CONFIRM.has(tool.name);
}

export interface PendingAction {
  id: string;
  dealershipId: string;
  userId: string;
  conversationId: string;
  tool: string;
  args: Record<string, unknown>;
  // Lo que ve el usuario en la tarjeta. Se arma con datos reales, no con lo
  // que dijo el modelo.
  label: string;
  description: string;
  destructive: boolean;
}

export type PendingActionView = Pick<PendingAction, "id" | "label" | "description" | "destructive">;

function actionKey(id: string): string {
  return `chat:action:${id}`;
}

async function readJson(bridge: McpBridge, tool: string, args: Record<string, unknown>) {
  const result = await bridge.callTool(tool, args);
  if (result.isError) throw new Error(toolResultText(result));
  return JSON.parse(toolResultText(result)) as Record<string, unknown>;
}

/** Describe la acción con los datos reales. Si no existe, tira con el error de la tool. */
async function describe(bridge: McpBridge, tool: string, args: Record<string, unknown>) {
  if (tool === "eliminar_gasto") {
    const costs = await readJson(bridge, "ver_costos_vehiculo", { vehiculo_id: args.vehiculo_id });
    const expenses = (costs.gastos ?? []) as { id: string; categoria: string; detalle: string | null; monto: string; moneda: string }[];
    const expense = expenses.find((e) => e.id === args.gasto_id);
    if (!expense) throw new Error("Ese gasto no existe en este vehículo.");
    return {
      label: CHAT_COPY.actions.deleteExpense,
      description: `${expense.categoria}${expense.detalle ? ` (${expense.detalle})` : ""}: ${expense.moneda} ${expense.monto} · ${String(costs.vehiculo)}`,
    };
  }
  if (tool === "publicar_vehiculo") {
    const vehicle = await readJson(bridge, "ver_vehiculo", { vehiculo_id: args.vehiculo_id });
    const publish = args.publicar !== false;
    const price = `${String(vehicle.moneda)} ${String(vehicle.precio)}`;
    return {
      label: publish ? CHAT_COPY.actions.publish : CHAT_COPY.actions.unpublish,
      description: `${String(vehicle.titulo)} · ${price}`,
    };
  }
  return { label: CHAT_COPY.actions.generic, description: tool };
}

export async function createPendingAction(
  ctx: ServiceContext,
  bridge: McpBridge,
  input: { conversationId: string; tool: Tool; args: Record<string, unknown> }
): Promise<PendingAction> {
  const { label, description } = await describe(bridge, input.tool.name, input.args);
  const action: PendingAction = {
    id: randomUUID(),
    dealershipId: ctx.dealership.id,
    userId: ctx.dealership.currentUser.clerkUserId,
    conversationId: input.conversationId,
    tool: input.tool.name,
    args: input.args,
    label,
    description,
    destructive: input.tool.annotations?.destructiveHint === true,
  };
  await redis.set(actionKey(action.id), action, { ex: CHAT_LIMITS.pendingActionTtlSeconds });
  return action;
}

/**
 * Saca la acción de Redis (GETDEL: un doble click no la ejecuta dos veces) y
 * valida que sea de este usuario y este dealer.
 */
export async function takePendingAction(ctx: ServiceContext, id: string): Promise<PendingAction | null> {
  const action = await redis.getdel<PendingAction>(actionKey(id));
  if (!action) return null;
  const sameOwner =
    action.dealershipId === ctx.dealership.id && action.userId === ctx.dealership.currentUser.clerkUserId;
  return sameOwner ? action : null;
}

export function toPendingActionView(action: PendingAction): PendingActionView {
  return { id: action.id, label: action.label, description: action.description, destructive: action.destructive };
}
