/**
 * GET /api/notifications/unread-count → solo el contador de no-leídas.
 *
 * Endpoint liviano que consume el polling de la campanita. Lee el contador desde
 * Redis (cache-aside en lib/notifications), así el 95% de los ticks NO toca la
 * tabla de notificaciones en Postgres. Los items completos se piden aparte
 * (GET /api/notifications) solo al abrir la campanita.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { getUnreadCount } from "@/lib/notifications";
import { withLogger } from "@/lib/api-handler";

export const GET = withLogger(async () => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const unread = await getUnreadCount(dealership.id);
  return NextResponse.json({ data: { unread } });
});
