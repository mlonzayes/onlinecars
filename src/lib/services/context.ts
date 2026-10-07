import { getAccountBlockReason } from "@/lib/account-status";
import { logger } from "@/lib/logger";
import { canWrite } from "@/lib/permissions";
import { ServiceError } from "./service-error";
import type { DealershipWithUser } from "@/lib/auth";

export type ServiceSource = "dashboard" | "mcp";

/**
 * Todo lo que un servicio necesita saber de quién llama. El canal (handler del
 * dashboard o tool del MCP) resuelve el dealership con su propia auth y arma
 * esto; el servicio no sabe ni le importa de dónde vino la sesión.
 */
export interface ServiceContext {
  requestId: string;
  dealership: DealershipWithUser;
  source: ServiceSource;
}

/** Datos comunes para los logs de los servicios. Nunca PII. */
export function logMeta(ctx: ServiceContext, extra?: Record<string, unknown>) {
  return { dealershipId: ctx.dealership.id, source: ctx.source, ...extra };
}

export function assertAccountActive(ctx: ServiceContext, event: string): void {
  const reason = getAccountBlockReason(ctx.dealership);
  if (!reason) return;
  logger.warn(ctx.requestId, `${event}.account_blocked`, logMeta(ctx, { reason }));
  throw new ServiceError(
    "account_blocked",
    reason === "suspended"
      ? "Tu cuenta está suspendida. Contactanos para reactivarla."
      : "Tu período de prueba o suscripción venció. Renovala para seguir operando."
  );
}

/** Cuenta activa + rol con permiso de escritura sobre el stock. */
export function assertCanEditInventory(ctx: ServiceContext, event: string): void {
  assertAccountActive(ctx, event);
  if (canWrite(ctx.dealership.currentUser)) return;
  logger.warn(
    ctx.requestId,
    `${event}.forbidden`,
    logMeta(ctx, { role: ctx.dealership.currentUser.role })
  );
  throw new ServiceError("forbidden", "Tu usuario no tiene permiso para modificar el stock.");
}
