import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";

type Params = { id: string; docId: string };

// DELETE /api/ventas/[id]/documentos/[docId]
// Borra el documento del storage y del DB. El storage va primero — si falla,
// no nos quedamos con el registro huérfano apuntando a un archivo inexistente.
export const DELETE = withLogger<Params>(async (_request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "sales.documents.delete.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "sales.documents.delete.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id: saleId, docId } = params;

  const document = await prisma.saleDocument.findFirst({
    where: {
      id: docId,
      saleId,
      dealershipId: dealership.id,
    },
  });

  if (!document) {
    logger.warn(requestId, "sales.documents.delete.not_found", {
      dealershipId: dealership.id,
      saleId,
      docId,
    });
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  }

  await storage.delete(document.key);
  await prisma.saleDocument.delete({ where: { id: docId } });

  logger.info(requestId, "sales.documents.delete.ok", {
    dealershipId: dealership.id,
    saleId,
    docId,
  });

  return NextResponse.json({ data: { id: docId } });
});
