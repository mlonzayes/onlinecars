import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { auditFields, resolveSiteBuilderContext } from "@/lib/admin-context";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { detectImageMimeType } from "@/lib/validators/media";
import { ALLOWED_TENANT_IMAGE_MIME_TYPES, type AllowedTenantImageMimeType } from "@/lib/constants";
import { invalidateTenantHomeBundle } from "@/lib/tenant";

// Favicon del sitio del tenant. Espeja al handler de logo (mismo bucket público,
// misma validación por magic-number). Se guarda en Dealership.favicon; el tenant
// layout lo usa como icons, con fallback al logo si no hay favicon.
const MAX_FAVICON_BYTES = 1 * 1024 * 1024; // 1MB — un ícono no necesita más

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
    logger.warn(requestId, "favicon.upload.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ctx = await resolveSiteBuilderContext();
  const dealership = ctx?.dealership;
  if (!ctx || !dealership) {
    logger.warn(requestId, "favicon.upload.no_dealership", { userId });
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

  if (file.size > MAX_FAVICON_BYTES) {
    logger.warn(requestId, "favicon.upload.too_large", { dealershipId: dealership.id, sizeBytes: file.size });
    return NextResponse.json({ error: "Imagen demasiado grande (máx 1MB)" }, { status: 413 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const detected = detectImageMimeType(buffer);
  if (!detected || !(ALLOWED_TENANT_IMAGE_MIME_TYPES as readonly string[]).includes(detected)) {
    logger.warn(requestId, "favicon.upload.invalid_magic", { dealershipId: dealership.id, headerMime: file.type });
    return NextResponse.json({ error: "Formato de archivo no permitido" }, { status: 400 });
  }

  const detectedMime = detected as AllowedTenantImageMimeType;
  const filename = `${globalThis.crypto.randomUUID()}.${extensionForMime(detectedMime)}`;
  const keyPrefix = `tenant/${dealership.id}/favicon`;

  const { url } = await storage.upload({
    buffer,
    mimeType: detectedMime,
    keyPrefix,
    filename,
  });

  // Intentamos extraer la key del favicon anterior para borrarlo.
  let oldKey: string | null = null;
  if (dealership.favicon) {
    try {
      const parsedUrl = new URL(dealership.favicon);
      const match = parsedUrl.pathname.match(/(tenant\/[^/]+\/favicon\/[^/]+)$/);
      if (match) {
        oldKey = match[1];
      }
    } catch {
      // Ignorar error al parsear url anterior
    }
  }

  await prisma.dealership.update({
    where: { id: dealership.id },
    data: { favicon: url },
  });

  if (oldKey) {
    try {
      await storage.delete(oldKey, "public");
    } catch (error) {
      logger.warn(requestId, "favicon.upload.cleanup_failed", {
        dealershipId: dealership.id,
        oldKey,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await invalidateTenantHomeBundle(dealership.slug);

  logger.info(requestId, "favicon.upload.ok", {
    dealershipId: dealership.id,
    sizeBytes: file.size,
    mimeType: detectedMime,
    ...auditFields(ctx),
  });

  return NextResponse.json({ data: { url } }, { status: 201 });
});

export const DELETE = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "favicon.delete.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ctx = await resolveSiteBuilderContext();
  const dealership = ctx?.dealership;
  if (!ctx || !dealership) {
    logger.warn(requestId, "favicon.delete.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  if (!dealership.favicon) {
    return NextResponse.json({ error: "El concesionario no tiene ícono para eliminar" }, { status: 400 });
  }

  let oldKey: string | null = null;
  try {
    const parsedUrl = new URL(dealership.favicon);
    const match = parsedUrl.pathname.match(/(tenant\/[^/]+\/favicon\/[^/]+)$/);
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
      logger.warn(requestId, "favicon.delete.cleanup_failed", {
        dealershipId: dealership.id,
        oldKey,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await prisma.dealership.update({
    where: { id: dealership.id },
    data: { favicon: null },
  });

  await invalidateTenantHomeBundle(dealership.slug);

  logger.info(requestId, "favicon.delete.ok", {
    dealershipId: dealership.id,
    ...auditFields(ctx),
  });

  return NextResponse.json({ success: true });
});
