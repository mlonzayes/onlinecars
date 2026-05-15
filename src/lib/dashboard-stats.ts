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

export interface DashboardStats {
  salesByMonth: SalesByMonthPoint[];
  leadsBySource: LeadsBySourcePoint[];
  stockByStatus: StockByStatusPoint[];
  funnel: ConversionFunnelData;
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
  ] = await Promise.all([
    prisma.sale.findMany({
      where: {
        dealershipId,
        status: "completed",
        createdAt: { gte: sixMonthsAgo },
      },
      select: { salePrice: true, createdAt: true },
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
  for (const s of salesRaw) {
    const key = monthKey(s.createdAt);
    const slot = monthMap.get(key);
    if (slot) slot.total += s.salePrice.toNumber();
  }

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
  };
}
