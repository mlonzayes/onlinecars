/**
 * POST /api/concesionario/media/confirm
 *
 * Paso 2 de la subida directa: el browser ya puso el archivo en el bucket y acá
 * lo VALIDAMOS y lo registramos en DB.
 *
 * Request:  { "sectionType": "hero", "purpose": "hero_video", "key": "tenant/xxx/hero_video/uuid.mp4" }
 * Response: { "data": { id, purpose, sectionType, url, mimeType, order } }
 *
 * ============================================================================
 * ACÁ NO SE PIERDE LA VALIDACIÓN
 * ============================================================================
 * La objeción obvia a la subida directa es que el servidor nunca ve el archivo,
 * así que no puede chequear el magic-number. Falso: lee los primeros 16 bytes
 * del objeto YA SUBIDO con un GET ranged (una llamada, sin bajar el archivo) y
 * corre exactamente el mismo detector que el upload tradicional. El tamaño real
 * sale del ContentRange de esa misma llamada.
 *
 * Si algo no cierra, el objeto se BORRA del bucket antes de responder el error:
 * no queda basura ni archivos huérfanos sin fila en DB.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { auditFields, resolveSiteBuilderContext } from "@/lib/admin-context";
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

// 16 bytes alcanzan para los dos formatos: MP4 mira los bytes 4..7 ("ftyp") y
// WebM los 0..3 (EBML).
const MAGIC_HEAD_BYTES = 16;

const confirmSchema = z
  .object({
    sectionType: z.string(),
    purpose: z.string(),
    key: z.string().min(1).max(300),
  })
  .strict();

function isSingleton(purpose: MediaPurpose): boolean {
  return (SINGLETON_MEDIA_PURPOSES as readonly MediaPurpose[]).includes(purpose);
}

export const POST = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "media.confirm.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ctx = await resolveSiteBuilderContext();
  const dealership = ctx?.dealership;
  if (!ctx || !dealership) {
    logger.warn(requestId, "media.confirm.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const body: unknown = await request.json();
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const metaParsed = mediaUploadMetadataSchema.safeParse({
    sectionType: parsed.data.sectionType,
    purpose: parsed.data.purpose,
  });
  if (!metaParsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: metaParsed.error.flatten() },
      { status: 400 }
    );
  }

  const { sectionType, purpose } = metaParsed.data;
  const { key } = parsed.data;
  const isVideo = purpose === "hero_video";

  // MULTI-TENANCY: el key lo manda el cliente, así que hay que probar que sea
  // uno que NOSOTROS firmamos para ESTE dealership y ESTE propósito. Sin esto,
  // un dealer podría registrar como propio un objeto de otro tenant.
  const expectedPrefix = `tenant/${dealership.id}/${purpose}/`;
  if (!key.startsWith(expectedPrefix) || key.includes("..")) {
    logger.warn(requestId, "media.confirm.key_mismatch", {
      dealershipId: dealership.id,
      purpose,
      key,
    });
    return NextResponse.json({ error: "Referencia de archivo inválida" }, { status: 400 });
  }

  // Leemos del bucket lo que REALMENTE subió el browser.
  const probe = await storage.probeObject(key, MAGIC_HEAD_BYTES);
  if (!probe) {
    logger.warn(requestId, "media.confirm.object_missing", {
      dealershipId: dealership.id,
      key,
    });
    return NextResponse.json(
      { error: "No se encontró el archivo subido. Probá de nuevo." },
      { status: 400 }
    );
  }

  // Borra el objeto del bucket y devuelve el error. Cualquier rechazo a partir
  // de acá pasa por acá: si no registramos la fila, el archivo no se queda.
  async function reject(message: string, status: number, event: string, extra: object) {
    logger.warn(requestId, event, { dealershipId: dealership!.id, key, ...extra });
    try {
      await storage.delete(key, "public");
    } catch (error) {
      logger.warn(requestId, "media.confirm.orphan_cleanup_failed", {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return NextResponse.json({ error: message }, { status });
  }

  // Tamaño REAL (no el declarado en el presign).
  const maxBytes = isVideo ? MAX_HERO_VIDEO_BYTES : MAX_TENANT_IMAGE_BYTES;
  if (probe.sizeBytes > maxBytes) {
    return reject(
      isVideo ? "Video demasiado grande (máx 20MB)" : "Imagen demasiado grande (máx 5MB)",
      413,
      "media.confirm.too_large",
      { sizeBytes: probe.sizeBytes }
    );
  }

  // Magic-number sobre los bytes reales del bucket — el mismo chequeo que hace
  // el upload tradicional.
  let detectedMime: AllowedTenantImageMimeType | AllowedVideoMimeType;
  if (isVideo) {
    const detected = detectVideoMimeType(
      probe.head.buffer.slice(
        probe.head.byteOffset,
        probe.head.byteOffset + probe.head.byteLength
      ) as ArrayBuffer
    );
    if (!detected || !(ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(detected)) {
      return reject("Formato de archivo no permitido", 400, "media.confirm.invalid_magic", {
        purpose,
      });
    }
    detectedMime = detected;
  } else {
    const detected = detectImageMimeType(probe.head);
    if (
      !detected ||
      !(ALLOWED_TENANT_IMAGE_MIME_TYPES as readonly string[]).includes(detected)
    ) {
      return reject("Formato de archivo no permitido", 400, "media.confirm.invalid_magic", {
        purpose,
      });
    }
    detectedMime = detected as AllowedTenantImageMimeType;
  }

  if (purpose === "gallery_image") {
    const galleryCount = await prisma.dealershipMedia.count({
      where: { dealershipId: dealership.id, purpose: "gallery_image" },
    });
    if (galleryCount >= MAX_GALLERY_IMAGES) {
      return reject("Máximo 20 imágenes en la galería", 400, "media.confirm.gallery_full", {
        currentCount: galleryCount,
      });
    }
  }

  let existingSingleton: { id: string; key: string } | null = null;
  if (isSingleton(purpose)) {
    existingSingleton = await prisma.dealershipMedia.findFirst({
      where: { dealershipId: dealership.id, purpose },
      select: { id: true, key: true },
    });
  }

  const ops = [];
  if (existingSingleton) {
    ops.push(prisma.dealershipMedia.delete({ where: { id: existingSingleton.id } }));
  }
  ops.push(
    prisma.dealershipMedia.create({
      data: {
        dealershipId: dealership.id,
        sectionType,
        purpose,
        // La URL se DERIVA del key, nunca viene del cliente: termina en DB y
        // servida a los visitantes del sitio.
        url: storage.publicUrlFor(key),
        key,
        mimeType: detectedMime,
        sizeBytes: probe.sizeBytes,
        order: 0,
      },
    })
  );

  const results = await prisma.$transaction(ops);
  const created = results[results.length - 1];

  if (existingSingleton) {
    try {
      await storage.delete(existingSingleton.key, "public");
    } catch (error) {
      logger.warn(requestId, "media.confirm.singleton_cleanup_failed", {
        dealershipId: dealership.id,
        purpose,
        oldKey: existingSingleton.key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await invalidateTenantHomeBundle(dealership.slug);

  logger.info(requestId, "media.confirm.ok", {
    dealershipId: dealership.id,
    purpose,
    sectionType,
    sizeBytes: probe.sizeBytes,
    mimeType: detectedMime,
    replaced: existingSingleton !== null,
    ...auditFields(ctx),
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
