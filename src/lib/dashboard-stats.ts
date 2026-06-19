import { prisma } from "@/lib/prisma";

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
  ] = await Promise.all([
    prisma.sale.findMany({
      where: {
        dealershipId,
        status: "completed",
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        salePrice: true,
        createdAt: true,
        vehicle: {
          select: { costPrice: true, expenses: { select: { amount: true } } },
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

  // En la misma pasada acumulamos el resumen financiero.
  // Nota: sumamos importes sin convertir moneda (igual que salesByMonth). Si el
  // dealer mezcla ARS y USD, los totales no son exactos — pendiente FX.
  let grossRevenue = 0;
  let totalCost = 0;
  let revenueWithCost = 0;
  let salesWithCost = 0;
  for (const s of salesRaw) {
    const price = s.salePrice.toNumber();
    grossRevenue += price;

    const key = monthKey(s.createdAt);
    const slot = monthMap.get(key);
    if (slot) slot.total += price;

    // Margen/neta SOLO sobre ventas con costo cargado. Si costPrice es null la
    // venta no entra al cálculo (NO se asume costo 0 — eso inflaba el margen).
    // El costo total incluye los gastos de reacondicionamiento del vehículo.
    // Nota: se suman sin convertir moneda, igual que el resto del dashboard (FX pendiente).
    const costDecimal = s.vehicle?.costPrice ?? null;
    if (costDecimal !== null) {
      const expensesSum = (s.vehicle?.expenses ?? []).reduce(
        (sum, e) => sum + e.amount.toNumber(),
        0,
      );
      const cost = costDecimal.toNumber() + expensesSum;
      totalCost += cost;
      revenueWithCost += price;
      salesWithCost += 1;
      const netSlot = netMap.get(key);
      if (netSlot) netSlot.net += price - cost;
    }
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
      grossRevenue,
      totalCost,
      netProfit: revenueWithCost - totalCost,
      revenueWithCost,
      salesCount: salesRaw.length,
      salesWithCost,
    },
    netProfitByMonth: netMonths,
    stockByBrand,
    stockAging,
  };
}
