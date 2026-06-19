import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";

// Tipos de notificación soportados. Coordinar con NotificationBell (iconos) si
// se agregan nuevos. No usamos enum por convención del proyecto.
export const NOTIFICATION_TYPES = ["lead", "review", "sale"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// ─── Cache del contador de no-leídas (Redis) ────────────────────────────────
// El polling de la campanita lee este contador desde Redis en vez de pegarle a
// Postgres en cada tick. Patrón cache-aside: se recalcula desde la DB en el miss
// y se invalida al crear una notificación o al marcar todo como leído.
// FAIL-OPEN: si Redis se cae, todo cae al count de Postgres (servicio degradado,
// no roto), igual criterio que el rate-limit del proyecto.

const UNREAD_TTL_SECONDS = 3600; // safety net; las invalidaciones lo mantienen fresco

function unreadCountKey(dealershipId: string): string {
  return `notif:unread:${dealershipId}`;
}

// Contador de no-leídas. Lee de Redis; en miss recalcula desde Postgres y cachea.
export async function getUnreadCount(dealershipId: string): Promise<number> {
  try {
    const cached = await redis.get<number>(unreadCountKey(dealershipId));
    if (typeof cached === "number") return cached;
  } catch {
    // fail-open: seguimos al count de Postgres
  }

  const count = await prisma.notification.count({
    where: { dealershipId, readAt: null },
  });

  try {
    await redis.set(unreadCountKey(dealershipId), count, { ex: UNREAD_TTL_SECONDS });
  } catch {
    // si no se pudo cachear, no pasa nada — el próximo read recalcula
  }
  return count;
}

// Invalida el contador para que el próximo read lo recalcule (incluye la nueva).
export async function invalidateUnreadCount(dealershipId: string): Promise<void> {
  try {
    await redis.del(unreadCountKey(dealershipId));
  } catch {
    // fail-open
  }
}

// Deja el contador en 0 (al marcar todas como leídas) sin recalcular.
export async function resetUnreadCount(dealershipId: string): Promise<void> {
  try {
    await redis.set(unreadCountKey(dealershipId), 0, { ex: UNREAD_TTL_SECONDS });
  } catch {
    // fail-open
  }
}

interface CreateNotificationInput {
  dealershipId: string;
  type: NotificationType;
  title: string;
  body?: string;
  /** Ruta interna del dashboard para ir al recurso. */
  link?: string;
  /** requestId para trazabilidad en los logs. */
  requestId?: string;
}

/**
 * Crea una notificación in-app para un dealership.
 *
 * FAIL-OPEN: si la inserción falla, loggea y devuelve null SIN tirar la
 * excepción. Una notificación es secundaria — nunca debe romper el flujo
 * principal (crear un lead, una venta, etc). Por eso no se await-ea de forma
 * que bloquee la respuesta al usuario.
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<{ id: string } | null> {
  const { dealershipId, type, title, body, link, requestId } = input;
  try {
    const notification = await prisma.notification.create({
      data: { dealershipId, type, title, body: body ?? null, link: link ?? null },
      select: { id: true },
    });
    // Invalidar el contador cacheado: el próximo polling lo recalcula con la nueva.
    await invalidateUnreadCount(dealershipId);
    logger.info(requestId ?? "-", "notification.created", {
      dealershipId,
      type,
      notificationId: notification.id,
    });
    return notification;
  } catch (error) {
    logger.error(requestId ?? "-", "notification.create_failed", {
      dealershipId,
      type,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
