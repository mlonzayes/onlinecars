/**
 * POST /api/admin/blog/cover → super-admin sube la portada de una nota al
 * bucket PÚBLICO. Devuelve la URL para guardar en el campo coverImage.
 *
 * POST request:  multipart/form-data con el campo "file" (JPG, PNG o WebP, máx 5 MB)
 * POST response: { "data": { "url": "https://cdn.../blog/covers/uuid.webp" } }
 */
import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { storage } from "@/lib/storage";
import { MAX_TENANT_IMAGE_BYTES } from "@/lib/constants";
import { detectImageMimeType, getExtensionForMimeType } from "@/lib/validators/vehicle-image";
import { denyUnlessSuperAdmin } from "@/lib/blog-admin";

export const POST = withLogger(async (request, { requestId }) => {
  const denied = await denyUnlessSuperAdmin(requestId, "admin.blog.cover");
  if (denied) return denied;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 });
  }

  const value = formData.get("file");
  if (!(value instanceof File)) {
    return NextResponse.json({ error: "Archivo no recibido (campo 'file')" }, { status: 400 });
  }
  if (value.size > MAX_TENANT_IMAGE_BYTES) {
    return NextResponse.json({ error: "Imagen demasiado grande (máx 5 MB)" }, { status: 413 });
  }

  // Tipo real por magic number: el Content-Type del browser se falsifica fácil.
  const buffer = Buffer.from(await value.arrayBuffer());
  const mime = detectImageMimeType(buffer);
  if (!mime) {
    logger.warn(requestId, "admin.blog.cover.invalid_magic", { headerMime: value.type });
    return NextResponse.json({ error: "Formato no permitido (JPG, PNG o WebP)" }, { status: 400 });
  }

  const { url, key } = await storage.upload({
    buffer,
    mimeType: mime,
    keyPrefix: "blog/covers",
    filename: `${globalThis.crypto.randomUUID()}.${getExtensionForMimeType(mime)}`,
  });

  logger.info(requestId, "admin.blog.cover.uploaded", { key, sizeBytes: value.size });
  return NextResponse.json({ data: { url } }, { status: 201 });
});
