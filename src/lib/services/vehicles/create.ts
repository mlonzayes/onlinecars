import { Prisma, type Vehicle } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { invalidateVehicleCaches } from "@/lib/cache-tags";
import { canEditCosts } from "@/lib/permissions";
import { generateVehicleSlug } from "@/lib/utils/slug";
import { assertCanEditInventory, logMeta, type ServiceContext } from "../context";
import type { VehicleCreateInput } from "@/lib/validators/vehicle";

// publicSlug lleva sufijo hex aleatorio: la colisión con otro vehículo del mismo
// dealer es ~1 en 4 mil millones por brand+model+year. 3 intentos alcanzan.
const MAX_SLUG_RETRIES = 3;

function isSlugCollision(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    (error.meta.target as string[]).includes("publicSlug")
  );
}

/**
 * Crea un vehículo. Se crea como borrador salvo que el input traiga otra cosa:
 * un borrador no ocupa cupo del plan, así que acá no se valida el límite.
 */
export async function createVehicle(ctx: ServiceContext, input: VehicleCreateInput): Promise<Vehicle> {
  assertCanEditInventory(ctx, "vehicles.create");

  // costPrice/costCurrency solo los setea un admin. Si los manda otro rol se
  // descartan en silencio (no error) para no frenar la carga del resto.
  const { costPrice, costCurrency, ...rest } = input;
  const costs = canEditCosts(ctx.dealership.currentUser)
    ? { costPrice: costPrice ?? null, costCurrency: costCurrency ?? null }
    : {};

  for (let attempt = 1; attempt <= MAX_SLUG_RETRIES; attempt++) {
    try {
      const vehicle = await prisma.vehicle.create({
        data: {
          ...rest,
          ...costs,
          dealershipId: ctx.dealership.id,
          publicSlug: generateVehicleSlug(rest.brand, rest.model, rest.year),
        },
      });

      await invalidateVehicleCaches(ctx.dealership.slug);
      logger.info(
        ctx.requestId,
        "vehicles.create.ok",
        logMeta(ctx, { vehicleId: vehicle.id, publicSlug: vehicle.publicSlug })
      );
      return vehicle;
    } catch (error) {
      // Solo se reintenta por publicSlug. Otro P2002 (VIN, motorNumber) es un
      // duplicado real que el usuario tiene que resolver.
      if (!isSlugCollision(error) || attempt === MAX_SLUG_RETRIES) throw error;
      logger.warn(ctx.requestId, "vehicles.create.slug_collision", logMeta(ctx, { attempt }));
    }
  }

  // Inalcanzable: el último intento devuelve o tira. Lo exige el tipado.
  throw new Error("vehicles.create: slug retries exhausted");
}
