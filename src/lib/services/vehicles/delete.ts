import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { invalidateVehicleCaches } from "@/lib/cache-tags";
import { assertCanEditInventory, logMeta, type ServiceContext } from "../context";
import { isPrismaNotFound, ServiceError } from "../service-error";
import { assertNoBlockingSale, vehicleNotFound } from "./guards";

const EVENT = "vehicles.delete";

/** Borra el vehículo; las imágenes caen por cascade. Con venta activa, no. */
export async function deleteVehicle(ctx: ServiceContext, vehicleId: string): Promise<void> {
  assertCanEditInventory(ctx, EVENT);
  await assertNoBlockingSale(ctx, vehicleId, EVENT);

  try {
    await prisma.vehicle.delete({
      where: { id: vehicleId, dealershipId: ctx.dealership.id },
    });
  } catch (error) {
    if (isPrismaNotFound(error)) throw vehicleNotFound(ctx, vehicleId, EVENT);
    // P2003 = FK. El chequeo de venta activa cubre el caso normal; llegar acá
    // significa otra relación con onDelete: Restrict.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      const constraint = String(error.meta?.constraint ?? "desconocida");
      logger.warn(ctx.requestId, `${EVENT}.fk_violation`, logMeta(ctx, { vehicleId, constraint }));
      throw new ServiceError(
        "conflict",
        `No se puede eliminar: el vehículo tiene registros asociados que lo protegen (${constraint}).`
      );
    }
    throw error;
  }

  await invalidateVehicleCaches(ctx.dealership.slug);
  logger.info(ctx.requestId, `${EVENT}.ok`, logMeta(ctx, { vehicleId }));
}
