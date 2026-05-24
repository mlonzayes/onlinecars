/**
 * POST   /api/vehiculos/[id]/ml  → publica el vehículo en Mercado Libre
 * DELETE /api/vehiculos/[id]/ml  → cierra la publicación en ML
 * PATCH  /api/vehiculos/[id]/ml  → pausa o reactiva la publicación
 *
 * Body del PATCH: { action: "pause" | "reactivate" }
 */
import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildMLPayload,
  buildMLPreview,
  validateForMLPublish,
} from "@/lib/mercadolibre/mapper";
import {
  publishItem,
  updateItemStatus,
  uploadPicture,
} from "@/lib/mercadolibre/client";

type Params = { id: string };

// ─── POST — Publicar ──────────────────────────────────────────────────────────

export const POST = withLogger<Params>(async (request, ctx) => {
  const { requestId } = ctx;
  const dealership = await getCurrentDealership();
  if (!dealership) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const vehicleId = ctx.params.id;

  // Obtener vehículo con imágenes
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId, dealershipId: dealership.id },
    include: { images: { orderBy: { order: "asc" } } },
  });

  if (!vehicle) {
    return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
  }

  // ¿Ya tiene publicación activa?
  const existingListing = await prisma.mercadoLibreListing.findUnique({
    where: { vehicleId },
  });

  if (existingListing && existingListing.status !== "closed") {
    return NextResponse.json(
      { error: "Este vehículo ya tiene una publicación activa en Mercado Libre" },
      { status: 409 }
    );
  }

  // Verificar que tiene cuenta ML conectada
  const mlAccount = await prisma.mercadoLibreAccount.findUnique({
    where: { dealershipId: dealership.id },
  });

  if (!mlAccount) {
    return NextResponse.json(
      { error: "No hay cuenta de Mercado Libre conectada. Conectá tu cuenta en Configuración → Integraciones." },
      { status: 400 }
    );
  }

  // Leer listing_type_id del body (opcional, default: "silver")
  let listingTypeId = "silver";
  try {
    const body = await request.json();
    if (body.listingTypeId) listingTypeId = body.listingTypeId;
  } catch {
    // body vacío — OK
  }

  // Pre-validar datos obligatorios para ML — evita un 422 críptico de la API.
  const validationErrors = validateForMLPublish(vehicle, dealership);
  if (validationErrors.length > 0) {
    logger.warn(requestId, "ml.publish.validation_failed", {
      vehicleId,
      errors: validationErrors,
    });
    return NextResponse.json(
      {
        error: "Faltan datos para publicar en Mercado Libre",
        details: validationErrors,
      },
      { status: 400 }
    );
  }

  // Construir payload y publicar
  const payload = buildMLPayload(vehicle, dealership, listingTypeId);

  logger.info(requestId, "ml.publish.payload", {
    vehicleId,
    title: payload.title,
    categoryId: payload.category_id,
    listingTypeId: payload.listing_type_id,
    attributesCount: payload.attributes?.length ?? 0,
    picturesCount: payload.pictures?.length ?? 0,
  });

  let mlItem;
  try {
    mlItem = await publishItem(dealership.id, payload);
  } catch (err) {
    const rawError = err instanceof Error ? err.message : "Error publicando en ML";

    logger.error(requestId, "ml.publish.failed", {
      vehicleId,
      categoryId: payload.category_id,
      listingTypeId: payload.listing_type_id,
      mlError: rawError,
    });

    // Parseamos el detalle de ML para devolver algo legible al usuario en lugar
    // del JSON crudo. El raw queda en logs para diagnóstico.
    const friendlyMessage = humanizeMLError(rawError);

    if (existingListing) {
      await prisma.mercadoLibreListing.update({
        where: { vehicleId },
        data: { status: "error", errorMessage: rawError.slice(0, 500) },
      });
    }

    return NextResponse.json({ error: friendlyMessage }, { status: 422 });
  }

  // Mapear status de ML a nuestro enum. `payment_required` es válido para
  // clasificados de vehículos — el item existe pero el dealer tiene que pagar.
  const mappedStatus =
    mlItem.status === "active"
      ? "active"
      : mlItem.status === "payment_required"
      ? "payment_required"
      : "paused";

  logger.info(requestId, "ml.publish.success", {
    vehicleId,
    mlItemId: mlItem.id,
    mlStatus: mlItem.status,
    mappedStatus,
  });

  // Persistir el listing
  const listing = await prisma.mercadoLibreListing.upsert({
    where: { vehicleId },
    create: {
      dealershipId: dealership.id,
      vehicleId,
      mlAccountId: mlAccount.id,
      mlItemId: mlItem.id,
      status: mappedStatus,
      listingTypeId,
      permalink: mlItem.permalink,
      lastSyncedAt: new Date(),
      errorMessage: null,
    },
    update: {
      mlItemId: mlItem.id,
      status: mappedStatus,
      listingTypeId,
      permalink: mlItem.permalink,
      lastSyncedAt: new Date(),
      errorMessage: null,
    },
  });

  return NextResponse.json(
    {
      listing,
      preview: buildMLPreview(vehicle),
      paymentRequired: mlItem.status === "payment_required",
    },
    { status: 201 }
  );
});

// ─── DELETE — Cerrar publicación ──────────────────────────────────────────────

export const DELETE = withLogger<Params>(async (_request, ctx) => {
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

  // Caso especial: si el listing está en payment_required, ML NO permite cerrarlo
  // vía PUT /items (devuelve "status is not modifiable" porque nunca llegó a activo).
  // El item sin pagar expira solo en ML después de un tiempo. Acá solo limpiamos
  // nuestra DB y avisamos al usuario.
  if (listing.status === "payment_required") {
    logger.info(requestId, "ml.listing.discard_unpaid", {
      vehicleId,
      mlItemId: listing.mlItemId,
    });
    await prisma.mercadoLibreListing.delete({ where: { vehicleId } });
    return NextResponse.json({ closed: true, discardedUnpaid: true });
  }

  try {
    await updateItemStatus(dealership.id, listing.mlItemId, { status: "closed" });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Error cerrando publicación en ML";
    await prisma.mercadoLibreListing.update({
      where: { vehicleId },
      data: { status: "error", errorMessage: errorMessage.slice(0, 500) },
    });
    return NextResponse.json({ error: errorMessage }, { status: 422 });
  }

  await prisma.mercadoLibreListing.update({
    where: { vehicleId },
    data: { status: "closed", lastSyncedAt: new Date(), errorMessage: null },
  });

  return NextResponse.json({ closed: true });
});

// ─── PATCH — Pausar / Reactivar ───────────────────────────────────────────────

export const PATCH = withLogger<Params>(async (request, ctx) => {
  const dealership = await getCurrentDealership();
  if (!dealership) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const vehicleId = ctx.params.id;
  const body = await request.json();
  const action = body?.action;

  if (action !== "pause" && action !== "reactivate") {
    return NextResponse.json(
      { error: "action debe ser 'pause' o 'reactivate'" },
      { status: 400 }
    );
  }

  const listing = await prisma.mercadoLibreListing.findUnique({
    where: { vehicleId },
  });

  if (!listing || listing.dealershipId !== dealership.id) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }

  const mlStatus = action === "pause" ? "paused" : "active";

  try {
    await updateItemStatus(dealership.id, listing.mlItemId, { status: mlStatus });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Error actualizando publicación en ML";
    await prisma.mercadoLibreListing.update({
      where: { vehicleId },
      data: { status: "error", errorMessage },
    });
    return NextResponse.json({ error: errorMessage }, { status: 422 });
  }

  const updated = await prisma.mercadoLibreListing.update({
    where: { vehicleId },
    data: {
      status: mlStatus === "active" ? "active" : "paused",
      lastSyncedAt: new Date(),
      errorMessage: null,
    },
  });

  return NextResponse.json({ listing: updated });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface MLErrorCause {
  type?: string;
  code?: string;
  message?: string;
}

/**
 * Convierte el JSON crudo de error de ML en un mensaje legible para el usuario.
 * El raw queda en logs para diagnóstico; al frontend le mandamos algo entendible.
 */
function humanizeMLError(raw: string): string {
  // Buscar el primer "[" para extraer el JSON array que mete mlFetch en el mensaje.
  const jsonStart = raw.indexOf("[");
  if (jsonStart === -1) return raw.length > 200 ? raw.slice(0, 200) + "..." : raw;

  try {
    const parsed: MLErrorCause[] = JSON.parse(raw.slice(jsonStart));
    const errors = parsed.filter((p) => p.type === "error" && p.message);
    if (errors.length === 0) return "Mercado Libre rechazó la publicación. Revisá los datos del vehículo.";
    return errors.map((e) => `• ${e.message}`).join("\n");
  } catch {
    return raw.length > 200 ? raw.slice(0, 200) + "..." : raw;
  }
}
