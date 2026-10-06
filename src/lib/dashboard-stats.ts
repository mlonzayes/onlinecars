import { prisma } from "@/lib/prisma";
import { applySpread, getCurrentUsdRate } from "@/lib/exchange-rate";
import { computeFinancials } from "@/lib/dashboard-financials";

export interface SalesByMonthPoint {
  /** Clave YYYY-MM (sirve para ordenar). */
  month: string;
  /** Etiqueta corta para el eje X (ej: "Mar"). */
  label: string;
  total: number;
}

export interface LeadsBySourcePoint {
  source: "web" | "whatsapp" | "mercadolibre";
  count: number;
}

export interface StockByStatusPoint {
  status: "available" | "reserved" | "sold";
  count: number;
}

export interface ConversionFunnelData {
  totalLeads: number;
  contacted: number;
  qualified: number;
  completedSales: number;
}

// Resumen financiero de las ventas completadas (últimos 6 meses). Datos
// sensibles — el dashboard solo los muestra a admins.
//
// IMPORTANTE: el margen y la ganancia neta se calculan SOLO sobre las ventas que
// tienen el costo (costPrice) cargado. Las ventas sin costo NO se asumen con
// costo 0 (eso daba un margen 100% falso) — quedan fuera del cálculo y se
// reportan aparte para que el dashboard no mienta.
export interface FinancialSummary {
  /** Σ salePrice de TODAS las ventas completadas (lo facturado, real). */
  grossRevenue: number;
  /** Σ costPrice de las ventas con costo cargado. */
  totalCost: number;
  /** revenueWithCost - totalCost (solo ventas con costo cargado). */
  netProfit: number;
  /** Σ salePrice de las ventas con costo cargado (denominador del margen). */
  revenueWithCost: number;
  /** Cantidad total de ventas completadas en el período. */
  salesCount: number;
  /** Cuántas de esas ventas tienen el costo cargado. */
  salesWithCost: number;
  /** Ventas que no se pudieron pasar a pesos (USD sin cotización disponible). */
  unconvertedSales: number;
}

// Ganancia neta por mes (sensible — admin only).
export interface NetProfitByMonthPoint {
  month: string;
  label: string;
  net: number;
}

export interface StockByBrandPoint {
  brand: string;
  count: number;
}

// Antigüedad del stock disponible, por tramos de días desde la publicación.
export interface StockAgingPoint {
  bucket: string;
  count: number;
}

export interface DashboardStats {
  salesByMonth: SalesByMonthPoint[];
  leadsBySource: LeadsBySourcePoint[];
  stockByStatus: StockByStatusPoint[];
  funnel: ConversionFunnelData;
  financials: FinancialSummary;
  netProfitByMonth: NetProfitByMonthPoint[];
  stockByBrand: StockByBrandPoint[];
  stockAging: StockAgingPoint[];
}

const MONTH_LABELS_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Cotización de trabajo del dealer (BCRA + su spread), o null si no hay dato.
async function getDealerUsdToArsRate(dealershipId: string): Promise<number | null> {
  const [base, dealership] = await Promise.all([
    getCurrentUsdRate(),
    prisma.dealership.findUnique({ where: { id: dealershipId }, select: { usdSpread: true } }),
  ]);
  return base ? applySpread(base, Number(dealership?.usdSpread ?? 0)).effective : null;
}

export async function getDashboardStats(dealershipId: string): Promise<DashboardStats> {
  // Inicio del mes hace 5 meses (incluyendo el actual = 6 meses totales).
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    salesRaw,
    leadsBySourceRaw,
    stockByStatusRaw,
    totalLeads,
    contacted,
    qualified,
    completedSales,
    stockByBrandRaw,
    availablePublished,
    usdToArsRate,
  ] = await Promise.all([
    prisma.sale.findMany({
      where: {
        dealershipId,
        status: "completed",
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        salePrice: true,
        currency: true,
        createdAt: true,
        vehicle: {
          select: {
            costPrice: true,
            costCurrency: true,
            expenses: { select: { amount: true, currency: true } },
          },
        },
      },
    }),
    prisma.lead.groupBy({
      by: ["source"],
      where: { dealershipId },
      _count: { _all: true },
    }),
    prisma.vehicle.groupBy({
      by: ["status"],
      where: { dealershipId },
      _count: { _all: true },
    }),
    prisma.lead.count({ where: { dealershipId } }),
    prisma.lead.count({
      where: { dealershipId, status: { in: ["contacted", "qualified", "closed"] } },
    }),
    prisma.lead.count({ where: { dealershipId, status: "qualified" } }),
    prisma.sale.count({ where: { dealershipId, status: "completed" } }),
    prisma.vehicle.groupBy({
      by: ["brand"],
      where: { dealershipId },
      _count: { _all: true },
      orderBy: { _count: { brand: "desc" } },
    }),
    prisma.vehicle.findMany({
      where: { dealershipId, status: "available", publishedAt: { not: null } },
      select: { publishedAt: true },
    }),
    getDealerUsdToArsRate(dealershipId),
  ]);

  // Agrupar ventas por mes en memoria. Inicializamos los 6 slots en 0
  // para que los meses sin ventas aparezcan en el chart como cero (sin esto
  // la línea se rompe y queda visualmente confuso).
  const months: SalesByMonthPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    d.setDate(1);
    months.push({
      month: monthKey(d),
      label: MONTH_LABELS_ES[d.getMonth()],
      total: 0,
    });
  }
  const monthMap = new Map(months.map((m) => [m.month, m]));
  // Ganancia neta por mes: misma estructura de 6 slots, inicializada en 0.
  const netMonths: NetProfitByMonthPoint[] = months.map((m) => ({
    month: m.month,
    label: m.label,
    net: 0,
  }));
  const netMap = new Map(netMonths.map((m) => [m.month, m]));

  // Plata: todo se convierte a pesos ANTES de sumar (ver dashboard-financials.ts).
  const fin = computeFinancials(salesRaw, usdToArsRate, monthKey);
  for (const [key, totals] of fin.byMonth) {
    const slot = monthMap.get(key);
    if (slot) slot.total += totals.total;
    const netSlot = netMap.get(key);
    if (netSlot) netSlot.net += totals.net;
  }

  // Stock por marca: top 6 + "Otras" agrupando el resto.
  const brandSorted = stockByBrandRaw.map((g) => ({ brand: g.brand, count: g._count._all }));
  const TOP_BRANDS = 6;
  const topBrands = brandSorted.slice(0, TOP_BRANDS);
  const restBrands = brandSorted.slice(TOP_BRANDS).reduce((sum, b) => sum + b.count, 0);
  const stockByBrand: StockByBrandPoint[] =
    restBrands > 0 ? [...topBrands, { brand: "Otras", count: restBrands }] : topBrands;

  // Antigüedad del stock disponible: días desde publishedAt, en tramos.
  const now = Date.now();
  const agingBuckets = { "0-30 d": 0, "31-60 d": 0, "61-90 d": 0, "+90 d": 0 };
  for (const v of availablePublished) {
    if (!v.publishedAt) continue;
    const days = Math.floor((now - v.publishedAt.getTime()) / 86_400_000);
    if (days <= 30) agingBuckets["0-30 d"]++;
    else if (days <= 60) agingBuckets["31-60 d"]++;
    else if (days <= 90) agingBuckets["61-90 d"]++;
    else agingBuckets["+90 d"]++;
  }
  const stockAging: StockAgingPoint[] = Object.entries(agingBuckets).map(([bucket, count]) => ({
    bucket,
    count,
  }));

  return {
    salesByMonth: months,
    leadsBySource: leadsBySourceRaw.map((g) => ({
      source: g.source as LeadsBySourcePoint["source"],
      count: g._count._all,
    })),
    stockByStatus: stockByStatusRaw.map((g) => ({
      status: g.status as StockByStatusPoint["status"],
      count: g._count._all,
    })),
    funnel: { totalLeads, contacted, qualified, completedSales },
    financials: {
      grossRevenue: fin.grossRevenue,
      totalCost: fin.totalCost,
      netProfit: fin.revenueWithCost - fin.totalCost,
      revenueWithCost: fin.revenueWithCost,
      salesCount: salesRaw.length,
      salesWithCost: fin.salesWithCost,
      unconvertedSales: fin.unconvertedSales,
    },
    netProfitByMonth: netMonths,
    stockByBrand,
    stockAging,
  };
}
