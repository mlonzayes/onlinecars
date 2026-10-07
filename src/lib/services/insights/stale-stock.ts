import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { canSeeCosts } from "@/lib/permissions";
import { assertAccountActive, logMeta, type ServiceContext } from "../context";
import { daysAgo } from "../pagination";

const MAX_ITEMS = 30;

/**
 * Vehículos disponibles y publicados hace `minDays` días o más, del más viejo
 * al más nuevo. Con las consultas recibidas y, si el usuario puede ver costos,
 * lo que se lleva gastado en cada uno: es lo que hace falta para decidir a
 * cuál bajarle el precio.
 */
export async function getStaleStock(ctx: ServiceContext, minDays: number) {
  assertAccountActive(ctx, "insights.stale_stock");
  const showCosts = canSeeCosts(ctx.dealership.currentUser, ctx.dealership);
  const where = {
    dealershipId: ctx.dealership.id,
    status: "available",
    publishedAt: { not: null, lte: daysAgo(minDays) },
  };

  const [total, vehicles] = await Promise.all([
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({
      where,
      orderBy: { publishedAt: "asc" },
      take: MAX_ITEMS,
      select: {
        id: true,
        title: true,
        year: true,
        price: true,
        currency: true,
        kilometers: true,
        publishedAt: true,
        costPrice: showCosts,
        costCurrency: showCosts,
        expenses: showCosts ? { select: { amount: true, currency: true } } : false,
        _count: { select: { leads: true } },
      },
    }),
  ]);

  const now = Date.now();
  logger.info(ctx.requestId, "insights.stale_stock.ok", logMeta(ctx, { minDays, total }));
  return {
    total,
    mostrando: vehicles.length,
    vehiculos: vehicles.map((v) => {
      const expenses: Record<string, number> = {};
      for (const e of v.expenses ?? []) expenses[e.currency] = (expenses[e.currency] ?? 0) + e.amount.toNumber();
      return {
        id: v.id,
        titulo: v.title,
        anio: v.year,
        precio: v.price.toString(),
        moneda: v.currency,
        kilometros: v.kilometers,
        diasPublicado: v.publishedAt ? Math.floor((now - v.publishedAt.getTime()) / 86_400_000) : null,
        consultasRecibidas: v._count.leads,
        ...(showCosts
          ? { precioCompra: v.costPrice?.toString() ?? null, monedaCompra: v.costCurrency, gastosPorMoneda: expenses }
          : {}),
      };
    }),
  };
}
