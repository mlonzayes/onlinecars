/**
 * POST /api/vehiculos/[id]/ml/sync
 *
 * Sincroniza on-demand el estado del listing con ML. Útil cuando el dealer
 * pagó la publicación desde ML y nuestro DB todavía dice "payment_required".
 *
 * Hace GET /items/{mlItemId} a ML y actualiza nuestro row.
 */
import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getItem } from "@/lib/mercadolibre/client";

type Params = { id: string };

export const POST = withLogger<Params>(async (_request, ctx) => {
  const { requestId } = ctx;
  const dealership = await getCurrentDealership();
  if (!dealership) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const vehicleId = ctx.params.id;

  const listing = await prisma.mercadoLibreListing.findUnique({
    where: { vehicleId },
  });

  if (!listing || listing.dealershipId !== dealership.id) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }

  let mlItem;
  try {
    mlItem = await getItem(dealership.id, listing.mlItemId);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Error al consultar ML";
    logger.error(requestId, "ml.sync.failed", {
      vehicleId,
      mlItemId: listing.mlItemId,
      mlError: errorMessage,
    });
    return NextResponse.json({ error: "No se pudo consultar el estado en Mercado Libre" }, { status: 502 });
  }

  // Mapear status de ML a nuestro enum
  const mappedStatus =
    mlItem.status === "active"
      ? "active"
      : mlItem.status === "payment_required"
      ? "payment_required"
      : mlItem.status === "closed"
      ? "closed"
      : "paused";

  logger.info(requestId, "ml.sync.success", {
    vehicleId,
    mlItemId: listing.mlItemId,
    previousStatus: listing.status,
    newStatus: mappedStatus,
    mlRawStatus: mlItem.status,
  });

  const updated = await prisma.mercadoLibreListing.update({
    where: { vehicleId },
    data: {
      status: mappedStatus,
      permalink: mlItem.permalink ?? listing.permalink,
      lastSyncedAt: new Date(),
      errorMessage: null,
    },
  });

  return NextResponse.json({ listing: updated, changed: listing.status !== mappedStatus });
});
