import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import {
  MAX_DOCUMENT_SIZE_BYTES,
  MAX_DOCUMENTS_PER_SALE,
} from "@/lib/constants";
import {
  saleDocumentCreateSchema,
  detectDocumentMimeType,
  getExtensionForDocumentMime,
  isAllowedDocumentMimeType,
} from "@/lib/validators/sale-document";

type SaleParams = { id: string };

// GET /api/ventas/[id]/documentos
// Lista todos los documentos del legajo de la venta, ordenados por categoría
// y luego por fecha de subida (más recientes primero dentro de cada grupo).
export const GET = withLogger<SaleParams>(async (_request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "sales.documents.list.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "sales.documents.list.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id: saleId } = params;

  const sale = await prisma.sale.findFirst({
    where: { id: saleId, dealershipId: dealership.id },
    select: { id: true },
  });

  if (!sale) {
    return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
  }

  const documents = await prisma.saleDocument.findMany({
    where: { saleId, dealershipId: dealership.id },
    orderBy: [{ category: "asc" }, { uploadedAt: "desc" }],
  });

  return NextResponse.json({ data: documents });
});

// POST /api/ventas/[id]/documentos
// FormData con campos:
//   - file: el archivo (PDF, JPG, PNG o WebP — max 10MB)
//   - category: customer | vehicle | operation
//   - type: texto libre (ej: "DNI Frente", "Título")
//   - notes (opcional): texto libre
//   - issuedAt (opcional): ISO datetime
//   - expiresAt (opcional): ISO datetime
//
// Response 201: { data: SaleDocument }
export const POST = withLogger<SaleParams>(async (request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "sales.documents.upload.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "sales.documents.upload.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id: saleId } = params;

  const sale = await prisma.sale.findFirst({
    where: { id: saleId, dealershipId: dealership.id },
    select: { id: true, _count: { select: { documents: true } } },
  });

  if (!sale) {
    logger.warn(requestId, "sales.documents.upload.sale_not_found", {
      dealershipId: dealership.id,
      saleId,
    });
    return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
  }

  if (sale._count.documents >= MAX_DOCUMENTS_PER_SALE) {
    logger.warn(requestId, "sales.documents.upload.limit_reached", {
      dealershipId: dealership.id,
      saleId,
      currentCount: sale._count.documents,
    });
    return NextResponse.json(
      { error: `Máximo ${MAX_DOCUMENTS_PER_SALE} documentos por venta` },
      { status: 400 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const fileValue = formData.get("file");
  const file = fileValue instanceof File ? fileValue : null;

  if (!file) {
    return NextResponse.json(
      { error: "Archivo no recibido (campo 'file')" },
      { status: 400 }
    );
  }

  // Validamos los metadatos antes de tocar el archivo.
  const metadata = saleDocumentCreateSchema.safeParse({
    category: formData.get("category"),
    type: formData.get("type"),
    notes: formData.get("notes") || undefined,
    issuedAt: formData.get("issuedAt") || undefined,
    expiresAt: formData.get("expiresAt") || undefined,
  });

  if (!metadata.success) {
    logger.warn(requestId, "sales.documents.upload.invalid_metadata", {
      dealershipId: dealership.id,
      saleId,
      details: metadata.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: metadata.error.flatten() },
      { status: 400 }
    );
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: `Archivo demasiado grande. Máximo ${MAX_DOCUMENT_SIZE_BYTES / 1024 / 1024}MB`,
      },
      { status: 400 }
    );
  }

  if (!isAllowedDocumentMimeType(file.type)) {
    return NextResponse.json(
      { error: "Tipo de archivo no permitido. Solo PDF, JPG, PNG o WebP" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Validar magic number — no confiar en el header del browser.
  const detectedType = detectDocumentMimeType(buffer);
  if (!detectedType) {
    logger.warn(requestId, "sales.documents.upload.invalid_magic", {
      dealershipId: dealership.id,
      saleId,
      headerMime: file.type,
      size: file.size,
    });
    return NextResponse.json(
      { error: "El archivo no es un PDF o imagen válida" },
      { status: 400 }
    );
  }

  const filename = `${globalThis.crypto.randomUUID()}.${getExtensionForDocumentMime(detectedType)}`;
  const keyPrefix = `sales/${saleId}`;

  const { url, key } = await storage.uploadDocument({
    buffer,
    mimeType: detectedType,
    keyPrefix,
    filename,
  });

  const document = await prisma.saleDocument.create({
    data: {
      dealershipId: dealership.id,
      saleId,
      category: metadata.data.category,
      type: metadata.data.type,
      url,
      key,
      fileName: file.name,
      mimeType: detectedType,
      sizeBytes: buffer.length,
      notes: metadata.data.notes ?? null,
      issuedAt: metadata.data.issuedAt ? new Date(metadata.data.issuedAt) : null,
      expiresAt: metadata.data.expiresAt ? new Date(metadata.data.expiresAt) : null,
      uploadedBy: userId,
    },
  });

  logger.info(requestId, "sales.documents.upload.ok", {
    dealershipId: dealership.id,
    saleId,
    documentId: document.id,
    category: document.category,
    type: document.type,
    sizeBytes: buffer.length,
    mimeType: detectedType,
  });

  return NextResponse.json({ data: document }, { status: 201 });
});
