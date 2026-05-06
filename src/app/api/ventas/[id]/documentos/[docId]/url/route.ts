import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";

type Params = { id: string; docId: string };

// GET /api/ventas/[id]/documentos/[docId]/url
// Devuelve una URL accesible para abrir el documento. En S3 es una presigned
// URL con TTL corto; en local es la ruta pública directa. El front nunca usa
// document.url directo — siempre pasa por acá para que el driver decida.
//
// Multi-tenant: solo devuelve la URL si el documento pertenece al dealership
// del usuario autenticado.
export const GET = withLogger<Params>(async (_request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "sales.documents.url.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "sales.documents.url.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id: saleId, docId } = params;

  const document = await prisma.saleDocument.findFirst({
    where: {
      id: docId,
      saleId,
      dealershipId: dealership.id,
    },
    select: { id: true, key: true },
  });

  if (!document) {
    logger.warn(requestId, "sales.documents.url.not_found", {
      dealershipId: dealership.id,
      saleId,
      docId,
    });
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  }

  const url = await storage.getDocumentUrl(document.key);

  logger.info(requestId, "sales.documents.url.signed", {
    dealershipId: dealership.id,
    saleId,
    docId,
  });

  return NextResponse.json({ data: { url } });
});
