import { prisma } from "@/lib/prisma";
import { computeVehicleMargin } from "@/lib/margin";
import { applySpread, getCurrentUsdRate } from "@/lib/exchange-rate";
import type { Vehicle } from "@prisma/client";
import type { McpContext } from "../context";
import type { ExpenseView } from "@/lib/services/expenses";

/**
 * Ganancia de un vehículo: precio - compra - gastos, todo convertido a la
 * moneda de venta con la cotización de trabajo del dealer (BCRA + spread).
 *
 * Si el auto ya se vendió, se usa el precio REAL de la venta completada, no el
 * publicado: es la ganancia neta. Si no, es una estimación sobre el publicado.
 */
export async function computeVehicleProfit(ctx: McpContext, vehicle: Vehicle, expenses: ExpenseView[]) {
  const [completedSale, baseRate] = await Promise.all([
    prisma.sale.findFirst({
      where: { vehicleId: vehicle.id, dealershipId: ctx.dealership.id, status: "completed" },
      orderBy: { createdAt: "desc" },
      select: { salePrice: true, currency: true },
    }),
    getCurrentUsdRate(),
  ]);

  const usdToArsRate = baseRate ? applySpread(baseRate, Number(ctx.dealership.usdSpread)).effective : null;
  const price = completedSale ? completedSale.salePrice.toNumber() : vehicle.price.toNumber();
  const currency = completedSale ? completedSale.currency : vehicle.currency;

  const margin = computeVehicleMargin({
    price,
    currency,
    costPrice: vehicle.costPrice?.toNumber() ?? null,
    costCurrency: vehicle.costCurrency,
    usdToArsRate,
    expenses: expenses.map((e) => ({ amount: Number(e.amount), currency: e.currency })),
  });

  return {
    base: completedSale ? "venta_completada" : "precio_publicado",
    precioConsiderado: price,
    moneda: currency,
    cotizacionUsd: usdToArsRate,
    ganancia: margin ? Math.round(margin.amount * 100) / 100 : null,
    margenPorcentaje: margin ? Math.round(margin.pct * 10) / 10 : null,
    motivoSinCalculo: margin
      ? null
      : "Falta el precio de compra del vehículo, o no hay cotización para convertir entre monedas.",
  };
}
