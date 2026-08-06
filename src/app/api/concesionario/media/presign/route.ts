/**
 * POST /api/concesionario/media/presign
 *
 * Paso 1 de la subida directa browser → bucket. Firma una URL de PUT para que
 * el archivo NO pase por la función serverless.
 *
 * ¿Por qué existe? Vercel corta el request body de las funciones serverless en
 * 4.5MB. Un video de portada de 20MB no puede pasar por un route handler: la
 * request muere antes de llegar al código. Con el presign, la función solo firma
 * y el browser sube directo a Contabo.
 *
 * Request:  { "sectionType": "hero", "purpose": "hero_video",
 *             "mimeType": "video/mp4", "sizeBytes": 14680064 }
 * Response: { "data": { "mode": "s3", "uploadUrl": "https://...", "key": "tenant/.../x.mp4" } }
 *           { "data": { "mode": "direct" } }  ← driver local: usar el POST normal
 *
 * Nada de esto reemplaza la validación: el archivo se verifica de verdad en
 * /media/confirm, leyendo los primeros bytes de lo que quedó en el bucket.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { resolveSiteBuilderContext } from "@/lib/admin-context";
import { storage } from "@/lib/storage";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import {
  mediaUploadMetadataSchema,
  extensionForMime,
} from "@/lib/validators/media";
import {
  ALLOWED_TENANT_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_HERO_VIDEO_BYTES,
  MAX_TENANT_IMAGE_BYTES,
  type AllowedTenantImageMimeType,
  type AllowedVideoMimeType,
} from "@/lib/constants";

const presignSchema = z
  .object({
    sectionType: z.string(),
    purpose: z.string(),
    // Tipo DECLARADO por el browser. Sirve para firmar el Content-Type y elegir
    // la extensión; NO se confía en él — confirm lee los bytes reales.
    mimeType: z.string(),
    sizeBytes: z.number().int().positive(),
  })
  .strict();

export const POST = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "media.presign.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ctx = await resolveSiteBuilderContext();
  const dealership = ctx?.dealership;
  if (!dealership) {
    logger.warn(requestId, "media.presign.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const body: unknown = await request.json();
  const parsed = presignSchema.safeParse(body);
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
  const isVideo = purpose === "hero_video";
  const { mimeType, sizeBytes } = parsed.data;

  const allowed: readonly string[] = isVideo
    ? ALLOWED_VIDEO_MIME_TYPES
    : ALLOWED_TENANT_IMAGE_MIME_TYPES;
  if (!allowed.includes(mimeType)) {
    return NextResponse.json({ error: "Formato de archivo no permitido" }, { status: 400 });
  }

  // Chequeo temprano contra el tamaño DECLARADO: evita firmar una subida que
  // vamos a rechazar igual. El tamaño real se re-verifica en confirm.
  const maxBytes = isVideo ? MAX_HERO_VIDEO_BYTES : MAX_TENANT_IMAGE_BYTES;
  if (sizeBytes > maxBytes) {
    return NextResponse.json(
      {
        error: isVideo
          ? "Video demasiado grande (máx 20MB)"
          : "Imagen demasiado grande (máx 5MB)",
      },
      { status: 413 }
    );
  }

  const extension = extensionForMime(
    mimeType as AllowedTenantImageMimeType | AllowedVideoMimeType
  );
  const filename = `${globalThis.crypto.randomUUID()}.${extension}`;
  const keyPrefix = `tenant/${dealership.id}/${purpose}`;

  // La firma se hace local (no pega a la red), pero puede tirar por env vars
  // faltantes o por incompatibilidades del SDK con el provider. Sin este catch
  // sale un 500 genérico y hay que ir a buscar el stack a los logs de Vercel.
  let signed;
  try {
    signed = await storage.createUploadUrl({ keyPrefix, filename, mimeType });
  } catch (error) {
    logger.error(requestId, "media.presign.sign_failed", {
      dealershipId: dealership.id,
      purpose,
      driver: process.env.STORAGE_DRIVER ?? "local",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "No se pudo preparar la subida (storage)", requestId },
      { status: 500 }
    );
  }

  // Driver local (dev): no firma nada. El cliente cae al POST tradicional, que
  // en local anda perfecto porque el límite de 4.5MB es de Vercel, no de Next.
  if (!signed) {
    logger.info(requestId, "media.presign.direct_fallback", {
      dealershipId: dealership.id,
      purpose,
    });
    return NextResponse.json({ data: { mode: "direct" as const } });
  }

  logger.info(requestId, "media.presign.ok", {
    dealershipId: dealership.id,
    purpose,
    sectionType,
    declaredSizeBytes: sizeBytes,
    declaredMime: mimeType,
  });

  return NextResponse.json({
    data: { mode: "s3" as const, uploadUrl: signed.uploadUrl, key: signed.key },
  });
});
