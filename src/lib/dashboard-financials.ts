import type { Prisma } from "@prisma/client";
import { convertAmount } from "@/lib/margin";

// Moneda en la que el dashboard muestra la plata (cards y gráficos).
export const DASHBOARD_CURRENCY = "ARS";

export interface FinancialSaleInput {
  salePrice: Prisma.Decimal;
  currency: string;
  createdAt: Date;
  vehicle: {
    costPrice: Prisma.Decimal | null;
    costCurrency: string | null;
    expenses: { amount: Prisma.Decimal; currency: string }[];
  } | null;
}

export interface FinancialTotals {
  grossRevenue: number;
  totalCost: number;
  revenueWithCost: number;
  salesWithCost: number;
  /** Ventas que no se pudieron pasar a pesos (otra moneda y sin cotización). */
  unconvertedSales: number;
  /** Por mes (YYYY-MM): facturado y ganancia neta, en pesos. */
  byMonth: Map<string, { total: number; net: number }>;
}

/**
 * Suma ventas, costos y gastos llevando TODO a pesos antes de sumar.
 *
 * Antes se sumaban los montos crudos: un auto comprado a U$S 20.000 y vendido
 * a $25.000.000 figuraba con $24.980.000 de ganancia. Ahora cada monto en USD
 * se convierte con la cotización de trabajo del dealer (BCRA + spread).
 *
 * Limitaciones, a propósito:
 * - Se usa la cotización de HOY, no la del día de la operación (no guardamos la
 *   histórica). Para el orden de magnitud de un dashboard alcanza.
 * - Sin cotización, una venta en USD no se puede convertir: queda fuera de los
 *   totales y se cuenta en `unconvertedSales`, en vez de sumarla mal.
 * - El margen solo se calcula sobre ventas con costo cargado (sin costo NO se
 *   asume 0: eso daba un margen del 100% falso).
 */
export function computeFinancials(
  sales: FinancialSaleInput[],
  usdToArsRate: number | null,
  monthKey: (d: Date) => string
): FinancialTotals {
  const toArs = (amount: number, currency: string) =>
    convertAmount(amount, currency, DASHBOARD_CURRENCY, usdToArsRate);

  const totals: FinancialTotals = {
    grossRevenue: 0,
    totalCost: 0,
    revenueWithCost: 0,
    salesWithCost: 0,
    unconvertedSales: 0,
    byMonth: new Map(),
  };

  for (const sale of sales) {
    const price = toArs(sale.salePrice.toNumber(), sale.currency);
    if (price === null) {
      totals.unconvertedSales += 1;
      continue;
    }

    const key = monthKey(sale.createdAt);
    const month = totals.byMonth.get(key) ?? { total: 0, net: 0 };
    totals.byMonth.set(key, month);
    totals.grossRevenue += price;
    month.total += price;

    const vehicle = sale.vehicle;
    if (!vehicle?.costPrice) continue;

    // El costo incluye los gastos de reacondicionamiento, cada uno en su moneda.
    const parts = [
      toArs(vehicle.costPrice.toNumber(), vehicle.costCurrency ?? sale.currency),
      ...vehicle.expenses.map((e) => toArs(e.amount.toNumber(), e.currency)),
    ];
    if (parts.some((p) => p === null)) {
      totals.unconvertedSales += 1;
      continue;
    }
    const cost = parts.reduce<number>((sum, p) => sum + (p ?? 0), 0);

    totals.totalCost += cost;
    totals.revenueWithCost += price;
    totals.salesWithCost += 1;
    month.net += price - cost;
  }

  return totals;
}
