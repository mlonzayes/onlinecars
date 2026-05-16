import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { blockingSaleErrorBody, findBlockingSale } from "@/lib/sale-guards";
import { invalidateTenantHomeBundle } from "@/lib/tenant";

type Params = { id: string; imageId: string };

// DELETE /api/vehiculos/[id]/images/[imageId]
// Borra la imagen del DB y del storage. Si era la principal, asigna esa marca
// a la siguiente imagen en orden.
export const DELETE = withLogger<Params>(async (_request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "vehicles.images.delete.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "vehicles.images.delete.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id: vehicleId, imageId } = params;

  const image = await prisma.vehicleImage.findFirst({
    where: {
      id: imageId,
      vehicleId,
      vehicle: { dealershipId: dealership.id },
    },
  });

  if (!image) {
    logger.warn(requestId, "vehicles.images.delete.not_found", {
      dealershipId: dealership.id,
      vehicleId,
      imageId,
    });
    return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
  }

  const blockingSale = await findBlockingSale(vehicleId, dealership.id);
  if (blockingSale) {
    logger.warn(requestId, "vehicles.images.delete.blocked_by_sale", {
      dealershipId: dealership.id,
      vehicleId,
      imageId,
      saleId: blockingSale.id,
      saleStatus: blockingSale.status,
    });
    return NextResponse.json(blockingSaleErrorBody(blockingSale), { status: 409 });
  }

  // Borrar el archivo primero. Si esto falla rompemos antes de tocar el DB,
  // así evitamos quedarnos con un registro huérfano de un archivo que sigue existiendo.
  await storage.delete(image.key, "public");

  await prisma.$transaction(async (tx) => {
    await tx.vehicleImage.delete({ where: { id: imageId } });

    if (image.isPrimary) {
      const newFirst = await tx.vehicleImage.findFirst({
        where: { vehicleId },
        orderBy: { order: "asc" },
      });
      if (newFirst) {
        await tx.vehicleImage.update({
          where: { id: newFirst.id },
          data: { isPrimary: true },
        });
      }
    }
  });

  await invalidateTenantHomeBundle(dealership.slug);

  logger.info(requestId, "vehicles.images.delete.ok", {
    dealershipId: dealership.id,
    vehicleId,
    imageId,
  });

  return NextResponse.json({ data: { id: imageId } });
});
