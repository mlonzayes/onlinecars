import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { invalidateVehicleCaches } from "@/lib/cache-tags";
import { assertCanEditInventory, logMeta, type ServiceContext } from "../context";
import { isPrismaNotFound } from "../service-error";
import { assertCanPublishMore, vehicleNotFound } from "./guards";

const EVENT = "vehicles.publish";

export interface PublishResult {
  id: string;
  publishedAt: Date | null;
}

/**
 * Publica (`published: true`) o despublica un vehículo. Explícito a propósito:
 * un toggle repetido por error (doble click, reintento de la IA) daría vuelta
 * el estado. Si ya está como se pidió, no hace nada.
 */
export async function setVehiclePublished(
  ctx: ServiceContext,
  vehicleId: string,
  published: boolean
): Promise<PublishResult> {
  const existing = await findForPublish(ctx, vehicleId);
  if ((existing.publishedAt !== null) === published) return existing;
  return applyPublished(ctx, vehicleId, published);
}

/** Para el botón del panel: invierte el estado actual. */
export async function toggleVehiclePublished(
  ctx: ServiceContext,
  vehicleId: string
): Promise<PublishResult> {
  const existing = await findForPublish(ctx, vehicleId);
  return applyPublished(ctx, vehicleId, existing.publishedAt === null);
}

async function findForPublish(ctx: ServiceContext, vehicleId: string): Promise<PublishResult> {
  assertCanEditInventory(ctx, EVENT);
  const existing = await prisma.vehicle.findFirst({
    where: { id: vehicleId, dealershipId: ctx.dealership.id },
    select: { id: true, publishedAt: true },
  });
  if (!existing) throw vehicleNotFound(ctx, vehicleId, EVENT);
  return existing;
}

async function applyPublished(
  ctx: ServiceContext,
  vehicleId: string,
  published: boolean
): Promise<PublishResult> {
  // Despublicar nunca se bloquea; publicar consume cupo del plan.
  if (published) await assertCanPublishMore(ctx, vehicleId, EVENT);

  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId, dealershipId: ctx.dealership.id },
      data: { publishedAt: published ? new Date() : null },
      select: { id: true, publishedAt: true },
    });
    await invalidateVehicleCaches(ctx.dealership.slug);
    logger.info(ctx.requestId, `${EVENT}.toggled`, logMeta(ctx, { vehicleId, published }));
    return vehicle;
  } catch (error) {
    if (isPrismaNotFound(error)) throw vehicleNotFound(ctx, vehicleId, EVENT);
    throw error;
  }
}
