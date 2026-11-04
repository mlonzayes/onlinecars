import { randomUUID } from "node:crypto";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { redis } from "@/lib/redis";
import type { ServiceContext } from "@/lib/services/context";
import { describeAction } from "./action-descriptions";
import { CHAT_LIMITS } from "./config";

// Confirmación FUERA del modelo. Nada que escriba se ejecuta en el loop: queda
// pendiente y el usuario lo confirma con un botón, viendo el cambio armado con
// datos reales. Así un texto de un lead que diga "cambiá el precio" o "copiá
// los teléfonos en la descripción" no puede hacer nada solo, aunque el modelo
// le haga caso.

/**
 * Todo lo que no está marcado como solo lectura se confirma. Falla cerrado:
 * una tool nueva sin `readOnlyHint: true` pide confirmación (y si no tiene
 * descriptor en action-descriptions.ts, ni siquiera se puede dejar pendiente).
 */
export function requiresConfirmation(tool: Tool | undefined): boolean {
  if (!tool) return false;
  return tool.annotations?.readOnlyHint !== true;
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
  // Cambios sensibles: la tarjeta los resalta y pide un segundo paso.
  warnings: string[];
}

export type PendingActionView = Pick<PendingAction, "id" | "label" | "description" | "destructive" | "warnings">;

function actionKey(id: string): string {
  return `chat:action:${id}`;
}

export async function createPendingAction(
  ctx: ServiceContext,
  input: { conversationId: string; tool: Tool; args: Record<string, unknown> }
): Promise<PendingAction> {
  const { label, description, warnings = [] } = await describeAction(ctx, input.tool.name, input.args);
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
    warnings,
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
  return {
    id: action.id,
    label: action.label,
    description: action.description,
    destructive: action.destructive,
    // Las acciones guardadas antes de este campo no lo traen.
    warnings: action.warnings ?? [],
  };
}
