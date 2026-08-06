import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { VEHICLE_STATUSES } from "@/lib/constants";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { blockingSaleErrorBody, findBlockingSale } from "@/lib/sale-guards";
import { invalidateVehicleCaches } from "@/lib/cache-tags";

type VehicleParams = { id: string };

const statusUpdateSchema = z.object({
  status: z.enum(VEHICLE_STATUSES),
});

// PATCH /api/vehiculos/[id]/status
// Cambia el status del vehículo.
// Body: { status: "available" | "reserved" | "sold" }
// Ejemplo: PATCH /api/vehiculos/abc123/status  { "status": "sold" }
// Response 200: { data: { id, status } }
export const PATCH = withLogger<VehicleParams>(async (request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "vehicles.status.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "vehicles.status.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id } = params;

  const body: unknown = await request.json();
  const parsed = statusUpdateSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn(requestId, "vehicles.status.invalid_input", {
      dealershipId: dealership.id,
      vehicleId: id,
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // El status del vehículo está gobernado por la venta activa (si la hay).
  // No permitimos override manual mientras hay venta en curso.
  const blockingSale = await findBlockingSale(id, dealership.id);
  if (blockingSale) {
    logger.warn(requestId, "vehicles.status.blocked_by_sale", {
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
      data: { status: parsed.data.status },
      select: { id: true, status: true },
    });

    await invalidateVehicleCaches(dealership.slug);

    logger.info(requestId, "vehicles.status.updated", {
      dealershipId: dealership.id,
      vehicleId: id,
      status: vehicle.status,
    });

    return NextResponse.json({ data: vehicle });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      logger.warn(requestId, "vehicles.status.not_found", {
        dealershipId: dealership.id,
        vehicleId: id,
      });
      return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
    }
    throw error;
  }
});
