import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDealership } from "@/lib/auth";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";

type Params = { id: string };

const VALID_STATUSES = ["pending", "approved", "rejected"] as const;

// PATCH /api/dashboard/reviews/[id]
// Cambia el status de una review (moderación).
export const PATCH = withLogger<Params>(async (request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "reviews.update.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "reviews.update.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id } = params;
  const body = (await request.json()) as { status?: unknown };

  if (
    typeof body.status !== "string" ||
    !(VALID_STATUSES as readonly string[]).includes(body.status)
  ) {
    logger.warn(requestId, "reviews.update.invalid_status", {
      dealershipId: dealership.id,
      reviewId: id,
      received: body.status,
    });
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  // Verificamos pertenencia al tenant antes de actualizar.
  const review = await prisma.review.findFirst({
    where: { id, dealershipId: dealership.id },
    select: { id: true },
  });

  if (!review) {
    logger.warn(requestId, "reviews.update.not_found", {
      dealershipId: dealership.id,
      reviewId: id,
    });
    return NextResponse.json({ error: "Opinión no encontrada" }, { status: 404 });
  }

  const updated = await prisma.review.update({
    where: { id },
    data: { status: body.status },
  });

  logger.info(requestId, "reviews.update.ok", {
    dealershipId: dealership.id,
    reviewId: id,
    status: body.status,
  });

  return NextResponse.json({ data: updated });
});

// DELETE /api/dashboard/reviews/[id]
// Elimina permanentemente una review.
export const DELETE = withLogger<Params>(async (_request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "reviews.delete.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "reviews.delete.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id } = params;

  const review = await prisma.review.findFirst({
    where: { id, dealershipId: dealership.id },
    select: { id: true },
  });

  if (!review) {
    logger.warn(requestId, "reviews.delete.not_found", {
      dealershipId: dealership.id,
      reviewId: id,
    });
    return NextResponse.json({ error: "Opinión no encontrada" }, { status: 404 });
  }

  await prisma.review.delete({ where: { id } });

  logger.info(requestId, "reviews.delete.ok", {
    dealershipId: dealership.id,
    reviewId: id,
  });

  return NextResponse.json({ data: { id } });
});
