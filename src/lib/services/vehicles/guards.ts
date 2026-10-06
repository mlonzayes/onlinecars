import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { canPublishMoreVehicles, getPlanLimits } from "@/lib/plans";
import { blockingSaleErrorBody, findBlockingSale } from "@/lib/sale-guards";
import { logMeta, type ServiceContext } from "../context";
import { ServiceError } from "../service-error";

/** Un vehículo con venta activa no se edita, no cambia de estado ni se borra. */
export async function assertNoBlockingSale(
  ctx: ServiceContext,
  vehicleId: string,
  event: string
): Promise<void> {
  const blockingSale = await findBlockingSale(vehicleId, ctx.dealership.id);
  if (!blockingSale) return;

  logger.warn(
    ctx.requestId,
    `${event}.blocked_by_sale`,
    logMeta(ctx, { vehicleId, saleId: blockingSale.id, saleStatus: blockingSale.status })
  );
  const { error, ...details } = blockingSaleErrorBody(blockingSale);
  throw new ServiceError("conflict", error, details);
}

/**
 * El límite del plan se cuenta por vehículos PUBLICADOS (ver
 * `canPublishMoreVehicles`). Se llama solo al pasar de borrador a publicado:
 * despublicar o crear un borrador nunca se bloquea.
 */
export async function assertCanPublishMore(
  ctx: ServiceContext,
  vehicleId: string,
  event: string
): Promise<void> {
  const publishedCount = await prisma.vehicle.count({
    where: { dealershipId: ctx.dealership.id, publishedAt: { not: null } },
  });
  if (canPublishMoreVehicles(ctx.dealership, publishedCount)) return;

  const limit = getPlanLimits(ctx.dealership).maxVehicles;
  logger.warn(
    ctx.requestId,
    `${event}.plan_limit_reached`,
    logMeta(ctx, { vehicleId, publishedCount, limit, plan: ctx.dealership.plan })
  );
  throw new ServiceError(
    "plan_limit",
    `Alcanzaste el límite de tu plan: ${limit} vehículos publicados. Despublicá alguno o mejorá tu plan para publicar este.`
  );
}

export function vehicleNotFound(ctx: ServiceContext, vehicleId: string, event: string): ServiceError {
  logger.warn(ctx.requestId, `${event}.not_found`, logMeta(ctx, { vehicleId }));
  return new ServiceError("not_found", "Vehículo no encontrado");
}
