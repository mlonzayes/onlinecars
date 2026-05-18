import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import {
  mediaUploadMetadataSchema,
  detectVideoMimeType,
  detectImageMimeType,
} from "@/lib/validators/media";
import {
  ALLOWED_TENANT_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_GALLERY_IMAGES,
  MAX_HERO_VIDEO_BYTES,
  MAX_TENANT_IMAGE_BYTES,
  SINGLETON_MEDIA_PURPOSES,
  type AllowedTenantImageMimeType,
  type AllowedVideoMimeType,
  type MediaPurpose,
} from "@/lib/constants";
import { invalidateTenantHomeBundle } from "@/lib/tenant";

// Extensión por mime (incluye imagen + video). Espejado del helper de vehicle-image
// pero ampliado para los formatos del tenant builder.
function extensionForMime(
  mime: AllowedTenantImageMimeType | AllowedVideoMimeType
): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "video/mp4":
      return "mp4";
    case "video/webm":
      return "webm";
  }
}

function isSingleton(purpose: MediaPurpose): boolean {
  return (SINGLETON_MEDIA_PURPOSES as readonly MediaPurpose[]).includes(purpose);
}

// POST /api/concesionario/media
// multipart/form-data:
//   - file: Blob (imagen JPG/PNG/WebP <=5MB | video MP4/WebM <=20MB para hero_video)
//   - sectionType: SectionType
//   - purpose: MediaPurpose
// Response 201: { data: { id, purpose, sectionType, url, mimeType, order } }
export const POST = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "media.upload.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "media.upload.no_dealership", { userId });
    return NextResponse.json(
      { error: "Concesionario no encontrado" },
      { status: 404 }
    );
  }

  // Parsear multipart
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "FormData inválido" },
      { status: 400 }
    );
  }

  const fileValue = formData.get("file");
  const file = fileValue instanceof File ? fileValue : null;
  if (!file) {
    return NextResponse.json(
      { error: "Archivo no recibido (campo 'file')" },
      { status: 400 }
    );
  }

  const metaParsed = mediaUploadMetadataSchema.safeParse({
    sectionType: formData.get("sectionType"),
    purpose: formData.get("purpose"),
  });

  if (!metaParsed.success) {
    logger.warn(requestId, "media.upload.invalid_metadata", {
      dealershipId: dealership.id,
      details: metaParsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: metaParsed.error.flatten() },
      { status: 400 }
    );
  }

  const { sectionType, purpose } = metaParsed.data;
  const isVideo = purpose === "hero_video";

  // Size check según categoría
  if (isVideo) {
    if (file.size > MAX_HERO_VIDEO_BYTES) {
      logger.warn(requestId, "media.upload.too_large", {
        dealershipId: dealership.id,
        purpose,
        sizeBytes: file.size,
      });
      return NextResponse.json(
        { error: "Video demasiado grande (máx 20MB)" },
        { status: 413 }
      );
    }
  } else {
    if (file.size > MAX_TENANT_IMAGE_BYTES) {
      logger.warn(requestId, "media.upload.too_large", {
        dealershipId: dealership.id,
        purpose,
        sizeBytes: file.size,
      });
      return NextResponse.json(
        { error: "Imagen demasiado grande (máx 5MB)" },
        { status: 413 }
      );
    }
  }

  // Magic-number check — no confiar en el Content-Type del browser.
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let detectedMime: AllowedTenantImageMimeType | AllowedVideoMimeType | null;
  if (isVideo) {
    const detected = detectVideoMimeType(arrayBuffer);
    if (
      !detected ||
      !(ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(detected)
    ) {
      logger.warn(requestId, "media.upload.invalid_magic", {
        dealershipId: dealership.id,
        purpose,
        headerMime: file.type,
      });
      return NextResponse.json(
        { error: "Formato de archivo no permitido" },
        { status: 400 }
      );
    }
    detectedMime = detected;
  } else {
    const detected = detectImageMimeType(buffer);
    if (
      !detected ||
      !(ALLOWED_TENANT_IMAGE_MIME_TYPES as readonly string[]).includes(detected)
    ) {
      logger.warn(requestId, "media.upload.invalid_magic", {
        dealershipId: dealership.id,
        purpose,
        headerMime: file.type,
      });
      return NextResponse.json(
        { error: "Formato de archivo no permitido" },
        { status: 400 }
      );
    }
    detectedMime = detected as AllowedTenantImageMimeType;
  }

  // Gallery cap: máximo 20 imágenes en la galería por dealership.
  if (purpose === "gallery_image") {
    const galleryCount = await prisma.dealershipMedia.count({
      where: { dealershipId: dealership.id, purpose: "gallery_image" },
    });
    if (galleryCount >= MAX_GALLERY_IMAGES) {
      logger.warn(requestId, "media.upload.gallery_full", {
        dealershipId: dealership.id,
        currentCount: galleryCount,
      });
      return NextResponse.json(
        { error: "Máximo 20 imágenes en la galería" },
        { status: 400 }
      );
    }
  }

  // Si es singleton, ubicamos el row existente para reemplazarlo dentro de la
  // misma transacción que el insert (atomicidad). El delete del archivo en
  // storage corre AFTER del commit — best-effort.
  let existingSingleton: { id: string; key: string } | null = null;
  if (isSingleton(purpose)) {
    existingSingleton = await prisma.dealershipMedia.findFirst({
      where: { dealershipId: dealership.id, purpose },
      select: { id: true, key: true },
    });
  }

  // Subir a storage. Si falla, no tocamos DB.
  const filename = `${globalThis.crypto.randomUUID()}.${extensionForMime(detectedMime)}`;
  const keyPrefix = `tenant/${dealership.id}/${purpose}`;

  const { url, key } = await storage.upload({
    buffer,
    mimeType: detectedMime,
    keyPrefix,
    filename,
  });

  // Insert + (optional) singleton DB cleanup atómicos.
  const created = await prisma.$transaction(async (tx) => {
    if (existingSingleton) {
      await tx.dealershipMedia.delete({ where: { id: existingSingleton.id } });
    }
    return tx.dealershipMedia.create({
      data: {
        dealershipId: dealership.id,
        sectionType,
        purpose,
        url,
        key,
        mimeType: detectedMime,
        sizeBytes: file.size,
        order: 0,
      },
    });
  });

  // Best-effort delete del asset viejo en storage. Si falla (ej: key legacy:),
  // loggeamos y seguimos — el DB ya está consistente.
  if (existingSingleton) {
    try {
      await storage.delete(existingSingleton.key, "public");
    } catch (error) {
      logger.warn(requestId, "media.upload.singleton_cleanup_failed", {
        dealershipId: dealership.id,
        purpose,
        oldKey: existingSingleton.key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await invalidateTenantHomeBundle(dealership.slug);

  logger.info(requestId, "media.upload.ok", {
    dealershipId: dealership.id,
    purpose,
    sectionType,
    sizeBytes: file.size,
    mimeType: detectedMime,
    replaced: existingSingleton !== null,
  });

  return NextResponse.json(
    {
      data: {
        id: created.id,
        purpose: created.purpose as MediaPurpose,
        sectionType: created.sectionType,
        url: created.url,
        mimeType: created.mimeType,
        order: created.order,
      },
    },
    { status: 201 }
  );
});
