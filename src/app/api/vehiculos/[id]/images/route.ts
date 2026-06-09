import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import {
  MAX_IMAGES_PER_VEHICLE,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/constants";
import {
  detectImageMimeType,
  getExtensionForMimeType,
  isAllowedMimeType,
} from "@/lib/validators/vehicle-image";
import { blockingSaleErrorBody, findBlockingSale } from "@/lib/sale-guards";
import { invalidateTenantHomeBundle } from "@/lib/tenant";
import { getPlanLimits } from "@/lib/plans";

type VehicleParams = { id: string };

// POST /api/vehiculos/[id]/images
// FormData con field "file" (image/jpeg | image/png | image/webp, max 8MB).
// Response 201: { data: VehicleImage, meta: { key } }
export const POST = withLogger<VehicleParams>(async (request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "vehicles.images.upload.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "vehicles.images.upload.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id: vehicleId } = params;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, dealershipId: dealership.id },
    select: { id: true, _count: { select: { images: true } } },
  });

  if (!vehicle) {
    logger.warn(requestId, "vehicles.images.upload.vehicle_not_found", {
      dealershipId: dealership.id,
      vehicleId,
    });
    return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
  }

  const blockingSale = await findBlockingSale(vehicleId, dealership.id);
  if (blockingSale) {
    logger.warn(requestId, "vehicles.images.upload.blocked_by_sale", {
      dealershipId: dealership.id,
      vehicleId,
      saleId: blockingSale.id,
      saleStatus: blockingSale.status,
    });
    return NextResponse.json(blockingSaleErrorBody(blockingSale), { status: 409 });
  }

  // Tope efectivo = min(plan, sanity cap del producto). El plan da el techo
  // comercial, MAX_IMAGES_PER_VEHICLE evita abuso aún en Premium/Enterprise.
  const planLimits = getPlanLimits(dealership);
  const planMax = planLimits.maxImagesPerVehicle;
  const effectiveMax = Math.min(MAX_IMAGES_PER_VEHICLE, planMax);

  if (vehicle._count.images >= effectiveMax) {
    const isPlanLimit = planMax < MAX_IMAGES_PER_VEHICLE;
    logger.warn(requestId, "vehicles.images.upload.limit_reached", {
      dealershipId: dealership.id,
      vehicleId,
      currentCount: vehicle._count.images,
      effectiveMax,
      planMax,
      reason: isPlanLimit ? "plan" : "product",
    });
    const message = isPlanLimit
      ? `Llegaste al máximo de ${effectiveMax} fotos por vehículo de tu plan. Mejorá a Media para subir más.`
      : `Máximo ${MAX_IMAGES_PER_VEHICLE} imágenes por vehículo`;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  let file: File | null = null;
  try {
    const formData = await request.formData();
    const value = formData.get("file");
    file = value instanceof File ? value : null;
  } catch {
    file = null;
  }

  if (!file) {
    return NextResponse.json(
      { error: "Archivo no recibido (campo 'file')" },
      { status: 400 }
    );
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: `Archivo demasiado grande. Máximo ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB`,
      },
      { status: 400 }
    );
  }

  if (!isAllowedMimeType(file.type)) {
    return NextResponse.json(
      { error: "Tipo de archivo no permitido. Solo JPG, PNG o WebP" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Validar magic number — no confiar solo en el header del navegador
  const detectedType = detectImageMimeType(buffer);
  if (!detectedType) {
    logger.warn(requestId, "vehicles.images.upload.invalid_magic", {
      dealershipId: dealership.id,
      vehicleId,
      headerMime: file.type,
      size: file.size,
    });
    return NextResponse.json(
      { error: "El archivo no es una imagen válida" },
      { status: 400 }
    );
  }

  const filename = `${globalThis.crypto.randomUUID()}.${getExtensionForMimeType(detectedType)}`;
  const keyPrefix = `vehicles/${vehicleId}`;

  const { url, key } = await storage.upload({
    buffer,
    mimeType: detectedType,
    keyPrefix,
    filename,
  });

  const lastImage = await prisma.vehicleImage.findFirst({
    where: { vehicleId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const nextOrder = lastImage ? lastImage.order + 1 : 0;

  const image = await prisma.vehicleImage.create({
    data: {
      vehicleId,
      url,
      key,
      order: nextOrder,
      isPrimary: nextOrder === 0,
    },
  });

  await invalidateTenantHomeBundle(dealership.slug);

  logger.info(requestId, "vehicles.images.upload.ok", {
    dealershipId: dealership.id,
    vehicleId,
    imageId: image.id,
    order: nextOrder,
    sizeBytes: buffer.length,
    mimeType: detectedType,
  });

  return NextResponse.json({ data: image }, { status: 201 });
});
