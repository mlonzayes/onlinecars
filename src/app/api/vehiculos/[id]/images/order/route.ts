import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { imageOrderSchema } from "@/lib/validators/vehicle-image";
import { blockingSaleErrorBody, findBlockingSale } from "@/lib/sale-guards";

type VehicleParams = { id: string };

// PUT /api/vehiculos/[id]/images/order
// Body: { ids: string[] } — orden completo (de primera a última).
// La primera del listado queda como isPrimary=true, el resto false.
export const PUT = withLogger<VehicleParams>(async (request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "vehicles.images.order.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "vehicles.images.order.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id: vehicleId } = params;

  const body: unknown = await request.json();
  const parsed = imageOrderSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn(requestId, "vehicles.images.order.invalid_input", {
      dealershipId: dealership.id,
      vehicleId,
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, dealershipId: dealership.id },
    select: { id: true },
  });

  if (!vehicle) {
    return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
  }

  const blockingSale = await findBlockingSale(vehicleId, dealership.id);
  if (blockingSale) {
    logger.warn(requestId, "vehicles.images.order.blocked_by_sale", {
      dealershipId: dealership.id,
      vehicleId,
      saleId: blockingSale.id,
      saleStatus: blockingSale.status,
    });
    return NextResponse.json(blockingSaleErrorBody(blockingSale), { status: 409 });
  }

  // Verificar que el set de IDs entrante coincide exactamente con los del vehículo.
  // Esto detecta tanto IDs ajenos como faltantes.
  const existing = await prisma.vehicleImage.findMany({
    where: { vehicleId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((i) => i.id));
  const requestIds = new Set(parsed.data.ids);

  const setsMatch =
    requestIds.size === existingIds.size &&
    [...requestIds].every((id) => existingIds.has(id));

  if (!setsMatch) {
    logger.warn(requestId, "vehicles.images.order.id_mismatch", {
      dealershipId: dealership.id,
      vehicleId,
      requestCount: requestIds.size,
      existingCount: existingIds.size,
    });
    return NextResponse.json(
      { error: "El listado de imágenes no coincide con el vehículo" },
      { status: 400 }
    );
  }

  await prisma.$transaction(
    parsed.data.ids.map((id, index) =>
      prisma.vehicleImage.update({
        where: { id },
        data: { order: index, isPrimary: index === 0 },
      })
    )
  );

  logger.info(requestId, "vehicles.images.order.ok", {
    dealershipId: dealership.id,
    vehicleId,
    count: parsed.data.ids.length,
  });

  return NextResponse.json({ data: { ok: true } });
});
