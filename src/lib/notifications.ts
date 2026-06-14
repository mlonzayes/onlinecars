import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Tipos de notificación soportados. Coordinar con NotificationBell (iconos) si
// se agregan nuevos. No usamos enum por convención del proyecto.
export const NOTIFICATION_TYPES = ["lead", "review", "sale"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

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
