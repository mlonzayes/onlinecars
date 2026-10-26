import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { invalidateVehicleCaches } from "@/lib/cache-tags";
import { assertCanEditInventory, logMeta, type ServiceContext } from "../context";
import { isPrismaNotFound } from "../service-error";
import { recordAudit } from "../audit";
import { assertNoBlockingSale, vehicleNotFound } from "./guards";
import type { VehicleStatus } from "@/lib/constants";

const EVENT = "vehicles.status";

/** Cambio manual de estado. Con venta activa lo gobierna la venta, no se pisa. */
export async function setVehicleStatus(
  ctx: ServiceContext,
  vehicleId: string,
  status: VehicleStatus
): Promise<{ id: string; status: string }> {
  assertCanEditInventory(ctx, EVENT);
  await assertNoBlockingSale(ctx, vehicleId, EVENT);

  const before = await prisma.vehicle.findFirst({
    where: { id: vehicleId, dealershipId: ctx.dealership.id },
    select: { status: true },
  });
  if (!before) throw vehicleNotFound(ctx, vehicleId, EVENT);

  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId, dealershipId: ctx.dealership.id },
      data: { status },
      select: { id: true, status: true },
    });
    await invalidateVehicleCaches(ctx.dealership.slug);
    if (before.status !== status) {
      await recordAudit(ctx, {
        action: "vehicle.status",
        entityType: "vehicle",
        entityId: vehicleId,
        changes: { status: { from: before.status, to: status } },
      });
    }
    logger.info(ctx.requestId, `${EVENT}.updated`, logMeta(ctx, { vehicleId, status }));
    return vehicle;
  } catch (error) {
    if (isPrismaNotFound(error)) throw vehicleNotFound(ctx, vehicleId, EVENT);
    throw error;
  }
}
