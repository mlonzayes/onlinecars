import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { vehicleUpdateSchema } from "@/lib/validators/vehicle";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { blockingSaleErrorBody, findBlockingSale } from "@/lib/sale-guards";
import { invalidateVehicleCaches } from "@/lib/cache-tags";
import { canSeeCosts, canEditCosts } from "@/lib/permissions";
import { canPublishMoreVehicles, getPlanLimits } from "@/lib/plans";

type VehicleParams = { id: string };

// GET /api/vehiculos/[id]
// Devuelve el detalle de un vehículo con sus imágenes.
// Verifica que el vehículo pertenece al concesionario del usuario autenticado.
export const GET = withLogger<VehicleParams>(async (_request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "vehicles.detail.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "vehicles.detail.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id } = params;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, dealershipId: dealership.id },
    include: { images: { orderBy: { order: "asc" } } },
  });

  if (!vehicle) {
    logger.warn(requestId, "vehicles.detail.not_found", {
      dealershipId: dealership.id,
      vehicleId: id,
    });
    return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
  }

  logger.info(requestId, "vehicles.detail.ok", {
    dealershipId: dealership.id,
    vehicleId: id,
  });

  // Si el user no puede ver costos, proyectamos los campos como null.
  if (!canSeeCosts(dealership.currentUser, dealership)) {
    return NextResponse.json({
      data: { ...vehicle, costPrice: null, costCurrency: null },
    });
  }

  return NextResponse.json({ data: vehicle });
});

// PUT /api/vehiculos/[id]
// Actualiza todos los campos de un vehículo.
// Body: VehicleUpdateInput (todos los campos son opcionales)
export const PUT = withLogger<VehicleParams>(async (request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "vehicles.update.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "vehicles.update.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id } = params;

  const body: unknown = await request.json();
  const parsed = vehicleUpdateSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn(requestId, "vehicles.update.invalid_input", {
      dealershipId: dealership.id,
      vehicleId: id,
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const blockingSale = await findBlockingSale(id, dealership.id);
  if (blockingSale) {
    logger.warn(requestId, "vehicles.update.blocked_by_sale", {
      dealershipId: dealership.id,
      vehicleId: id,
      saleId: blockingSale.id,
      saleStatus: blockingSale.status,
    });
    return NextResponse.json(blockingSaleErrorBody(blockingSale), { status: 409 });
  }

  // Solo admins pueden modificar costPrice/costCurrency. Si un editor manda esos
  // campos en el body, los descartamos en silencio para que la actualización del
  // resto de los campos no se rompa por un permiso ajeno.
  const updateData = { ...parsed.data };
  if (!canEditCosts(dealership.currentUser)) {
    delete updateData.costPrice;
    delete updateData.costCurrency;
  }

  // Si el update PUBLICA un vehículo (publishedAt pasa de null a algo),
  // validamos contra el límite del plan. El conteo es por publicados activos.
  // No bloqueamos al CREAR el vehículo — un draft no ocupa slot del plan.
  if (updateData.publishedAt != null) {
    const current = await prisma.vehicle.findUnique({
      where: { id, dealershipId: dealership.id },
      select: { publishedAt: true },
    });
    const isGoingFromDraftToPublished = current && current.publishedAt === null;
    if (isGoingFromDraftToPublished) {
      const publishedCount = await prisma.vehicle.count({
        where: { dealershipId: dealership.id, publishedAt: { not: null } },
      });
      if (!canPublishMoreVehicles(dealership, publishedCount)) {
        const limit = getPlanLimits(dealership).maxVehicles;
        logger.warn(requestId, "vehicles.update.plan_limit_reached", {
          dealershipId: dealership.id,
          vehicleId: id,
          publishedCount,
          limit,
        });
        return NextResponse.json(
          {
            error: `Alcanzaste el límite de tu plan: ${limit} vehículos publicados. Despublicá alguno o mejorá tu plan para publicar este.`,
          },
          { status: 403 }
        );
      }
    }
  }

  try {
    const vehicle = await prisma.vehicle.update({
      where: { id, dealershipId: dealership.id },
      data: updateData,
    });

    await invalidateVehicleCaches(dealership.slug);

    logger.info(requestId, "vehicles.update.ok", {
      dealershipId: dealership.id,
      vehicleId: id,
    });

    return NextResponse.json({ data: vehicle });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      logger.warn(requestId, "vehicles.update.not_found", {
        dealershipId: dealership.id,
        vehicleId: id,
      });
      return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
    }
    throw error;
  }
});

// DELETE /api/vehiculos/[id]
// Elimina un vehículo. Las imágenes se eliminan por cascade (definido en el schema).
export const DELETE = withLogger<VehicleParams>(async (_request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "vehicles.delete.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "vehicles.delete.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id } = params;

  const blockingSale = await findBlockingSale(id, dealership.id);
  if (blockingSale) {
    logger.warn(requestId, "vehicles.delete.blocked_by_sale", {
      dealershipId: dealership.id,
      vehicleId: id,
      saleId: blockingSale.id,
      saleStatus: blockingSale.status,
    });
    return NextResponse.json(blockingSaleErrorBody(blockingSale), { status: 409 });
  }

  try {
    await prisma.vehicle.delete({
      where: { id, dealershipId: dealership.id },
    });

    await invalidateVehicleCaches(dealership.slug);

    logger.info(requestId, "vehicles.delete.ok", {
      dealershipId: dealership.id,
      vehicleId: id,
    });

    return NextResponse.json({ data: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        logger.warn(requestId, "vehicles.delete.not_found", {
          dealershipId: dealership.id,
          vehicleId: id,
        });
        return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
      }
      // P2003 = FK violation. Lo más común: hay una venta apuntando al vehículo
      // (Sale.vehicle es onDelete:Restrict). El blocking-sale check de arriba
      // cubre el caso normal — si llegamos acá es una FK distinta a la esperada.
      if (error.code === "P2003") {
        const constraint = String(error.meta?.constraint ?? "desconocida");
        logger.warn(requestId, "vehicles.delete.fk_violation", {
          dealershipId: dealership.id,
          vehicleId: id,
          constraint,
        });
        return NextResponse.json(
          {
            error: `No se puede eliminar: el vehículo tiene registros asociados que lo protegen (${constraint}).`,
          },
          { status: 409 }
        );
      }
    }
    throw error;
  }
});
