import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { vehicleUpdateSchema } from "@/lib/validators/vehicle";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { blockingSaleErrorBody, findBlockingSale } from "@/lib/sale-guards";
import { invalidateTenantHomeBundle } from "@/lib/tenant";

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

  try {
    const vehicle = await prisma.vehicle.update({
      where: { id, dealershipId: dealership.id },
      data: parsed.data,
    });

    await invalidateTenantHomeBundle(dealership.slug);

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

    await invalidateTenantHomeBundle(dealership.slug);

    logger.info(requestId, "vehicles.delete.ok", {
      dealershipId: dealership.id,
      vehicleId: id,
    });

    return NextResponse.json({ data: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      logger.warn(requestId, "vehicles.delete.not_found", {
        dealershipId: dealership.id,
        vehicleId: id,
      });
      return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
    }
    throw error;
  }
});
