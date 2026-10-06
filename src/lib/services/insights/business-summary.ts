import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { canSeeCosts } from "@/lib/permissions";
import { computeVehicleMargin } from "@/lib/margin";
import { assertAccountActive, logMeta, type ServiceContext } from "../context";
import { daysAgo } from "../pagination";
import { getDealerUsdRate } from "./exchange";

type ByCurrency = Record<string, number>;

function add(map: ByCurrency, currency: string, amount: number) {
  map[currency] = Math.round(((map[currency] ?? 0) + amount) * 100) / 100;
}

/**
 * Resumen del negocio en los últimos `days` días.
 *
 * A diferencia del dashboard (que suma ARS y USD sin convertir), acá cada venta
 * convierte su costo y sus gastos a la moneda en que se vendió, y los totales
 * se informan POR MONEDA. Nunca se suman pesos con dólares.
 *
 * Limitación: la conversión usa la cotización de HOY, no la del día de compra.
 * Las ventas se ubican en el período por fecha de alta (mismo criterio que el dashboard).
 */
export async function getBusinessSummary(ctx: ServiceContext, days: number) {
  assertAccountActive(ctx, "insights.business_summary");
  const dealershipId = ctx.dealership.id;
  const since = daysAgo(days);
  const showCosts = canSeeCosts(ctx.dealership.currentUser, ctx.dealership);

  const [rate, sales, leadsBySource, leadsByStatus, stockByStatus, published] = await Promise.all([
    getDealerUsdRate(ctx),
    prisma.sale.findMany({
      where: { dealershipId, status: "completed", createdAt: { gte: since } },
      select: {
        salePrice: true,
        currency: true,
        vehicle: {
          select: {
            costPrice: true,
            costCurrency: true,
            expenses: { select: { amount: true, currency: true } },
          },
        },
      },
    }),
    prisma.lead.groupBy({ by: ["source"], where: { dealershipId, createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.lead.groupBy({ by: ["status"], where: { dealershipId, createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.vehicle.groupBy({ by: ["status"], where: { dealershipId }, _count: { _all: true } }),
    prisma.vehicle.count({ where: { dealershipId, publishedAt: { not: null } } }),
  ]);

  const billed: ByCurrency = {};
  const profit: ByCurrency = {};
  let salesWithoutProfit = 0;
  for (const s of sales) {
    const price = s.salePrice.toNumber();
    add(billed, s.currency, price);
    if (!showCosts) continue;
    const margin = computeVehicleMargin({
      price,
      currency: s.currency,
      costPrice: s.vehicle.costPrice?.toNumber() ?? null,
      costCurrency: s.vehicle.costCurrency,
      usdToArsRate: rate?.effective ?? null,
      expenses: s.vehicle.expenses.map((e) => ({ amount: e.amount.toNumber(), currency: e.currency })),
    });
    if (margin) add(profit, margin.currency, margin.amount);
    else salesWithoutProfit += 1;
  }

  logger.info(ctx.requestId, "insights.business_summary.ok", logMeta(ctx, { days, sales: sales.length }));
  return {
    periodoDias: days,
    ventasCompletadas: sales.length,
    facturadoPorMoneda: billed,
    ...(showCosts
      ? {
          gananciaNetaPorMoneda: profit,
          ventasSinGananciaCalculable: salesWithoutProfit,
          notaGanancia:
            "Precio de venta menos compra y gastos, convertidos a la moneda de la venta con la cotización de hoy. " +
            "Las ventas sin precio de compra cargado no entran.",
        }
      : {}),
    consultasPorOrigen: Object.fromEntries(leadsBySource.map((r) => [r.source, r._count._all])),
    consultasPorEstado: Object.fromEntries(leadsByStatus.map((r) => [r.status, r._count._all])),
    stockPorEstado: Object.fromEntries(stockByStatus.map((r) => [r.status, r._count._all])),
    vehiculosPublicados: published,
  };
}
