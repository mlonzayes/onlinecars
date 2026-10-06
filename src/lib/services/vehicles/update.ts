import type { Vehicle } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { invalidateVehicleCaches } from "@/lib/cache-tags";
import { canEditCosts } from "@/lib/permissions";
import { assertCanEditInventory, logMeta, type ServiceContext } from "../context";
import { isPrismaNotFound } from "../service-error";
import { assertCanPublishMore, assertNoBlockingSale, vehicleNotFound } from "./guards";
import type { VehicleUpdateInput } from "@/lib/validators/vehicle";

const EVENT = "vehicles.update";

/** Actualización parcial. Si el cambio publica un borrador, valida el plan. */
export async function updateVehicle(
  ctx: ServiceContext,
  vehicleId: string,
  input: VehicleUpdateInput
): Promise<Vehicle> {
  assertCanEditInventory(ctx, EVENT);
  await assertNoBlockingSale(ctx, vehicleId, EVENT);

  // Un editor que manda costos no rompe el resto del update: se descartan.
  const data = { ...input };
  if (!canEditCosts(ctx.dealership.currentUser)) {
    delete data.costPrice;
    delete data.costCurrency;
  }

  if (data.publishedAt != null) {
    const current = await prisma.vehicle.findUnique({
      where: { id: vehicleId, dealershipId: ctx.dealership.id },
      select: { publishedAt: true },
    });
    if (current && current.publishedAt === null) {
      await assertCanPublishMore(ctx, vehicleId, EVENT);
    }
  }

  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId, dealershipId: ctx.dealership.id },
      data,
    });
    await invalidateVehicleCaches(ctx.dealership.slug);
    logger.info(ctx.requestId, `${EVENT}.ok`, logMeta(ctx, { vehicleId }));
    return vehicle;
  } catch (error) {
    if (isPrismaNotFound(error)) throw vehicleNotFound(ctx, vehicleId, EVENT);
    throw error;
  }
}
