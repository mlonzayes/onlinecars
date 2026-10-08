/**
 * POST /api/vehiculos/[id]/ml/destacar
 *
 * Destaca (o quita el destaque de) una publicación activa en Mercado Libre.
 * Consume un lugar del paquete de destaques del dealer; volver a "silver" lo libera.
 *
 * Request:  { "listingTypeId": "gold" | "gold_premium" | "silver" }
 * Response: { "data": { "listingTypeId": "gold" } }
 * Error:    { "error": "No tenés lugares disponibles para destacar..." } (422)
 */
import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlanLimits } from "@/lib/plans";
import { denyApiAccess } from "@/lib/api-access";
import { setItemListingType } from "@/lib/mercadolibre/packs";
import { mlListingTypeUpdateSchema } from "@/lib/validators/ml-listing-type";

type Params = { id: string };

export const POST = withLogger<Params>(async (request, ctx) => {
  const { requestId } = ctx;
  const dealership = await getCurrentDealership();
  if (!dealership) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const denied = denyApiAccess(requestId, dealership, "write");
  if (denied) return denied;

  if (!getPlanLimits(dealership).allowMLIntegration) {
    logger.warn(requestId, "ml.upgrade.plan_gated", { dealershipId: dealership.id });
    return NextResponse.json(
      { error: "Mercado Libre está disponible a partir del plan Media." },
      { status: 403 }
    );
  }

  const parsed = mlListingTypeUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Tipo de publicación inválido", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { listingTypeId } = parsed.data;

  const listing = await prisma.mercadoLibreListing.findFirst({
    where: { vehicleId: ctx.params.id, dealershipId: dealership.id },
  });
  if (!listing) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }
  if (listing.status !== "active") {
    return NextResponse.json(
      { error: "Solo se pueden destacar publicaciones activas en Mercado Libre." },
      { status: 409 }
    );
  }
  if (listing.listingTypeId === listingTypeId) {
    return NextResponse.json({ data: { listingTypeId } });
  }

  try {
    await setItemListingType(dealership.id, listing.mlItemId, listingTypeId);
  } catch (err) {
    const mlError = err instanceof Error ? err.message : "Error desconocido";
    logger.error(requestId, "ml.upgrade.failed", {
      vehicleId: listing.vehicleId,
      mlItemId: listing.mlItemId,
      listingTypeId,
      mlError,
    });
    return NextResponse.json(
      {
        error:
          listingTypeId === "silver"
            ? "Mercado Libre no permitió quitar el destaque. Probá de nuevo en unos minutos."
            : "No tenés lugares disponibles para destacar con ese tipo, o Mercado Libre rechazó el cambio.",
      },
      { status: 422 }
    );
  }

  await prisma.mercadoLibreListing.update({
    where: { id: listing.id },
    data: { listingTypeId, lastSyncedAt: new Date(), errorMessage: null },
  });

  logger.info(requestId, "ml.upgrade.success", {
    vehicleId: listing.vehicleId,
    mlItemId: listing.mlItemId,
    from: listing.listingTypeId,
    to: listingTypeId,
  });

  return NextResponse.json({ data: { listingTypeId } });
});
