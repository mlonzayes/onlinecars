/**
 * GET   /api/notifications  → últimas notificaciones del dealership + no leídas
 * PATCH /api/notifications  → marca TODAS las del dealership como leídas
 *
 * Ambos endpoints son autenticados y filtran SIEMPRE por dealershipId
 * (multi-tenancy no-negociable). La campanita del header consume el GET por
 * polling y dispara el PATCH con el botón "Marcar todas como leídas".
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { getUnreadCount, resetUnreadCount } from "@/lib/notifications";

const MAX_ITEMS = 20;

export const GET = withLogger(async (_request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { dealershipId: dealership.id },
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
    }),
    // El count sale de Redis (cache-aside); evita un count extra a Postgres.
    getUnreadCount(dealership.id),
  ]);

  logger.info(requestId, "notifications.list.ok", {
    dealershipId: dealership.id,
    count: items.length,
    unread,
  });

  return NextResponse.json({ data: items, meta: { unread } });
});

export const PATCH = withLogger(async (_request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const result = await prisma.notification.updateMany({
    where: { dealershipId: dealership.id, readAt: null },
    data: { readAt: new Date() },
  });

  // Dejamos el contador cacheado en 0 (sin recalcular desde Postgres).
  await resetUnreadCount(dealership.id);

  logger.info(requestId, "notifications.mark_all_read.ok", {
    dealershipId: dealership.id,
    updated: result.count,
  });

  return NextResponse.json({ data: { updated: result.count } });
});
