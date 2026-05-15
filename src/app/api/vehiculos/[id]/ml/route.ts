/**
 * POST   /api/vehiculos/[id]/ml  → publica el vehículo en Mercado Libre
 * DELETE /api/vehiculos/[id]/ml  → cierra la publicación en ML
 * PATCH  /api/vehiculos/[id]/ml  → pausa o reactiva la publicación
 *
 * Body del PATCH: { action: "pause" | "reactivate" }
 */
import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMLPayload, buildMLPreview } from "@/lib/mercadolibre/mapper";
import {
  publishItem,
  updateItemStatus,
  uploadPicture,
} from "@/lib/mercadolibre/client";

type Params = { id: string };

// ─── POST — Publicar ──────────────────────────────────────────────────────────

export const POST = withLogger<Params>(async (request, ctx) => {
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

  // Construir payload y publicar
  const payload = buildMLPayload(vehicle, listingTypeId);

  let mlItem;
  try {
    mlItem = await publishItem(dealership.id, payload);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Error publicando en ML";

    // Si ya había un listing (en estado error/closed), actualizar el mensaje
    if (existingListing) {
      await prisma.mercadoLibreListing.update({
        where: { vehicleId },
        data: { status: "error", errorMessage },
      });
    }

    return NextResponse.json({ error: errorMessage }, { status: 422 });
  }

  // Persistir el listing
  const listing = await prisma.mercadoLibreListing.upsert({
    where: { vehicleId },
    create: {
      dealershipId: dealership.id,
      vehicleId,
      mlAccountId: mlAccount.id,
      mlItemId: mlItem.id,
      status: mlItem.status === "active" ? "active" : "paused",
      listingTypeId,
      permalink: mlItem.permalink,
      lastSyncedAt: new Date(),
      errorMessage: null,
    },
    update: {
      mlItemId: mlItem.id,
      status: mlItem.status === "active" ? "active" : "paused",
      listingTypeId,
      permalink: mlItem.permalink,
      lastSyncedAt: new Date(),
      errorMessage: null,
    },
  });

  return NextResponse.json({ listing, preview: buildMLPreview(vehicle) }, { status: 201 });
});

// ─── DELETE — Cerrar publicación ──────────────────────────────────────────────

export const DELETE = withLogger<Params>(async (_request, ctx) => {
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

  try {
    await updateItemStatus(dealership.id, listing.mlItemId, { status: "closed" });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Error cerrando publicación en ML";
    await prisma.mercadoLibreListing.update({
      where: { vehicleId },
      data: { status: "error", errorMessage },
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
