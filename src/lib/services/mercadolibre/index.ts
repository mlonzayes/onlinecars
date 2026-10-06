import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { canUseML } from "@/lib/plans";
import { assertAccountActive, logMeta, type ServiceContext } from "../context";

const MAX_ITEMS = 20;

/**
 * Estado de la integración con MercadoLibre: cuenta conectada, publicaciones
 * por estado, las que tienen error y los autos publicados en el sitio que
 * todavía no están en ML. Nunca toca los tokens de la cuenta.
 */
export async function getMercadoLibreStatus(ctx: ServiceContext) {
  assertAccountActive(ctx, "ml.status");
  if (!canUseML(ctx.dealership)) {
    return { habilitadoEnPlan: false, mensaje: "La integración con MercadoLibre está disponible desde el plan Media." };
  }

  const dealershipId = ctx.dealership.id;
  const [account, byStatus, withErrors, missing, missingCount] = await Promise.all([
    prisma.mercadoLibreAccount.findUnique({ where: { dealershipId }, select: { nickname: true } }),
    prisma.mercadoLibreListing.groupBy({ by: ["status"], where: { dealershipId }, _count: { _all: true } }),
    prisma.mercadoLibreListing.findMany({
      where: { dealershipId, status: "error" },
      take: MAX_ITEMS,
      select: { errorMessage: true, vehicle: { select: { id: true, title: true } } },
    }),
    prisma.vehicle.findMany({
      where: { dealershipId, publishedAt: { not: null }, status: "available", mlListing: null },
      take: MAX_ITEMS,
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true, year: true },
    }),
    prisma.vehicle.count({
      where: { dealershipId, publishedAt: { not: null }, status: "available", mlListing: null },
    }),
  ]);

  logger.info(ctx.requestId, "ml.status.ok", logMeta(ctx, { connected: account !== null }));
  return {
    habilitadoEnPlan: true,
    cuentaConectada: account !== null,
    cuentaML: account?.nickname ?? null,
    publicacionesPorEstado: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])),
    publicacionesConError: withErrors.map((l) => ({
      vehiculoId: l.vehicle.id,
      vehiculo: l.vehicle.title,
      error: l.errorMessage,
    })),
    disponiblesSinPublicarEnML: { total: missingCount, vehiculos: missing },
  };
}
