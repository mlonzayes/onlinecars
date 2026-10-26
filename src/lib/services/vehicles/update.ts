import type { Prisma, Vehicle } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { invalidateVehicleCaches } from "@/lib/cache-tags";
import { canEditCosts } from "@/lib/permissions";
import { assertCanEditInventory, logMeta, type ServiceContext } from "../context";
import { isPrismaNotFound } from "../service-error";
import { auditDiff, recordAudit } from "../audit";
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

  // Estado previo de los campos que cambian: para el registro de auditoría y
  // para saber si el update publica un borrador.
  const fields = Object.keys(data) as (keyof VehicleUpdateInput & keyof Vehicle)[];
  const select: Prisma.VehicleSelect = Object.fromEntries([...fields, "publishedAt"].map((f) => [f, true]));
  const before = await prisma.vehicle.findFirst({ where: { id: vehicleId, dealershipId: ctx.dealership.id }, select });
  if (!before) throw vehicleNotFound(ctx, vehicleId, EVENT);

  if (data.publishedAt != null && before.publishedAt === null) {
    await assertCanPublishMore(ctx, vehicleId, EVENT);
  }

  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId, dealershipId: ctx.dealership.id },
      data,
    });
    await invalidateVehicleCaches(ctx.dealership.slug);
    const changes = auditDiff(before as Partial<Vehicle>, vehicle, fields);
    if (Object.keys(changes).length > 0) {
      await recordAudit(ctx, { action: "vehicle.update", entityType: "vehicle", entityId: vehicleId, changes });
    }
    logger.info(ctx.requestId, `${EVENT}.ok`, logMeta(ctx, { vehicleId }));
    return vehicle;
  } catch (error) {
    if (isPrismaNotFound(error)) throw vehicleNotFound(ctx, vehicleId, EVENT);
    throw error;
  }
}
