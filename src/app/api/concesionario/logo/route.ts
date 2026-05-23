import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { detectImageMimeType } from "@/lib/validators/media";
import { ALLOWED_TENANT_IMAGE_MIME_TYPES, type AllowedTenantImageMimeType } from "@/lib/constants";
import { invalidateTenantHomeBundle } from "@/lib/tenant";

const MAX_LOGO_BYTES = 5 * 1024 * 1024; // 5MB

function extensionForMime(mime: AllowedTenantImageMimeType): string {
  switch (mime) {
    case "image/jpeg": return "jpg";
    case "image/png": return "png";
    case "image/webp": return "webp";
  }
}

export const POST = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "logo.upload.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "logo.upload.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 });
  }

  const fileValue = formData.get("file");
  const file = fileValue instanceof File ? fileValue : null;
  if (!file) {
    return NextResponse.json({ error: "Archivo no recibido (campo 'file')" }, { status: 400 });
  }

  if (file.size > MAX_LOGO_BYTES) {
    logger.warn(requestId, "logo.upload.too_large", { dealershipId: dealership.id, sizeBytes: file.size });
    return NextResponse.json({ error: "Imagen demasiado grande (máx 5MB)" }, { status: 413 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const detected = detectImageMimeType(buffer);
  if (!detected || !(ALLOWED_TENANT_IMAGE_MIME_TYPES as readonly string[]).includes(detected)) {
    logger.warn(requestId, "logo.upload.invalid_magic", { dealershipId: dealership.id, headerMime: file.type });
    return NextResponse.json({ error: "Formato de archivo no permitido" }, { status: 400 });
  }

  const detectedMime = detected as AllowedTenantImageMimeType;
  const filename = `${globalThis.crypto.randomUUID()}.${extensionForMime(detectedMime)}`;
  const keyPrefix = `tenant/${dealership.id}/logo`;

  const { url, key } = await storage.upload({
    buffer,
    mimeType: detectedMime,
    keyPrefix,
    filename,
  });

  // Attempt to extract key from old logo URL to delete it
  let oldKey: string | null = null;
  if (dealership.logo) {
    try {
      const parsedUrl = new URL(dealership.logo);
      // For local it's /uploads/tenant/..., for s3 it's dependent on endpoint.
      // But all keys generally end with tenant/{id}/logo/{filename}
      const match = parsedUrl.pathname.match(/(tenant\/[^/]+\/logo\/[^/]+)$/);
      if (match) {
        oldKey = match[1];
      }
    } catch {
      // Ignorar error al parsear url anterior
    }
  }

  await prisma.dealership.update({
    where: { id: dealership.id },
    data: { logo: url },
  });

  if (oldKey) {
    try {
      await storage.delete(oldKey, "public");
    } catch (error) {
      logger.warn(requestId, "logo.upload.cleanup_failed", {
        dealershipId: dealership.id,
        oldKey,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await invalidateTenantHomeBundle(dealership.slug);

  logger.info(requestId, "logo.upload.ok", {
    dealershipId: dealership.id,
    sizeBytes: file.size,
    mimeType: detectedMime,
  });

  return NextResponse.json({ data: { url } }, { status: 201 });
});

export const DELETE = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "logo.delete.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "logo.delete.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  if (!dealership.logo) {
    return NextResponse.json({ error: "El concesionario no tiene logo para eliminar" }, { status: 400 });
  }

  let oldKey: string | null = null;
  try {
    const parsedUrl = new URL(dealership.logo);
    const match = parsedUrl.pathname.match(/(tenant\/[^/]+\/logo\/[^/]+)$/);
    if (match) {
      oldKey = match[1];
    }
  } catch {
    // Ignorar error al parsear url anterior
  }

  if (oldKey) {
    try {
      await storage.delete(oldKey, "public");
    } catch (error) {
      logger.warn(requestId, "logo.delete.cleanup_failed", {
        dealershipId: dealership.id,
        oldKey,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await prisma.dealership.update({
    where: { id: dealership.id },
    data: { logo: null },
  });

  await invalidateTenantHomeBundle(dealership.slug);

  logger.info(requestId, "logo.delete.ok", { dealershipId: dealership.id });

  return NextResponse.json({ success: true });
});
