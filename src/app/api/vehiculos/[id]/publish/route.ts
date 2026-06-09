import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { invalidateTenantHomeBundle } from "@/lib/tenant";
import { canPublishMoreVehicles, getPlanLimits } from "@/lib/plans";

type VehicleParams = { id: string };

// PATCH /api/vehiculos/[id]/publish
// Toggle publicado/despublicado.
// Si publishedAt es null → publica (setea fecha actual).
// Si tiene fecha → despublica (setea null).
export const PATCH = withLogger<VehicleParams>(async (_request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "vehicles.publish.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "vehicles.publish.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id } = params;

  const existing = await prisma.vehicle.findFirst({
    where: { id, dealershipId: dealership.id },
    select: { publishedAt: true },
  });

  if (!existing) {
    logger.warn(requestId, "vehicles.publish.not_found", {
      dealershipId: dealership.id,
      vehicleId: id,
    });
    return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
  }

  const newPublishedAt = existing.publishedAt ? null : new Date();
  const isPublishing = newPublishedAt !== null;

  // Plan gating: solo cuando va a publicar (despublicar nunca se bloquea).
  // El mismo gate vive en PUT /api/vehiculos/[id] cuando se transiciona draft→published
  // y en el bulk publish — replicado acá para que el toggle directo no escape el límite.
  if (isPublishing) {
    const publishedCount = await prisma.vehicle.count({
      where: { dealershipId: dealership.id, publishedAt: { not: null } },
    });
    if (!canPublishMoreVehicles(dealership, publishedCount)) {
      const limit = getPlanLimits(dealership).maxVehicles;
      logger.warn(requestId, "vehicles.publish.plan_limit_reached", {
        dealershipId: dealership.id,
        vehicleId: id,
        publishedCount,
        limit,
        plan: dealership.plan,
      });
      return NextResponse.json(
        {
          error: `Alcanzaste el límite de tu plan: ${limit} vehículos publicados. Despublicá alguno o mejorá tu plan para publicar este.`,
        },
        { status: 403 }
      );
    }
  }

  try {
    const vehicle = await prisma.vehicle.update({
      where: { id, dealershipId: dealership.id },
      data: { publishedAt: newPublishedAt },
      select: { id: true, publishedAt: true },
    });

    await invalidateTenantHomeBundle(dealership.slug);

    logger.info(requestId, "vehicles.publish.toggled", {
      dealershipId: dealership.id,
      vehicleId: id,
      published: vehicle.publishedAt !== null,
    });

    return NextResponse.json({ data: vehicle });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      logger.warn(requestId, "vehicles.publish.not_found", {
        dealershipId: dealership.id,
        vehicleId: id,
      });
      return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
    }
    throw error;
  }
});
