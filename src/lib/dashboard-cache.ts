import { redis } from "./redis";
import { logger } from "./logger";
import { prisma } from "./prisma";
import { getDashboardStats, type DashboardStats } from "./dashboard-stats";

// Cache-aside del home del dashboard. Cubre los counts + stats que se muestran
// en el resumen principal. TTL 1h: el resumen no necesita ser tiempo real y
// preferimos un dashboard rápido a uno preciso al segundo.

const DASHBOARD_HOME_TTL_SECONDS = 3600;

function dashboardHomeKey(dealershipId: string): string {
  // v2: se agregó `stats.financials`. El bump invalida entries con el shape viejo.
  return `dashboard:home:v2:${dealershipId}`;
}

export interface DashboardHomeData {
  stats: DashboardStats;
  vehicleCount: number;
  leadCount: number;
  newLeadCount: number;
  customerCount: number;
  activeSaleCount: number;
}

async function fetchDashboardHomeFromDb(dealershipId: string): Promise<DashboardHomeData> {
  // 4 queries paralelas. vehicleCount y leadCount los derivamos de stats:
  //   - vehicleCount = sum(stockByStatus[].count)
  //   - leadCount = funnel.totalLeads
  // Antes eran 6 queries con dos duplicadas (lead.count total y vehicle.count).
  const [stats, newLeadCount, customerCount, activeSaleCount] = await Promise.all([
    getDashboardStats(dealershipId),
    prisma.lead.count({ where: { dealershipId, status: "new" } }),
    prisma.customer.count({ where: { dealershipId } }),
    prisma.sale.count({
      where: {
        dealershipId,
        status: { in: ["draft", "reserved", "in_progress"] },
      },
    }),
  ]);

  const vehicleCount = stats.stockByStatus.reduce((sum, s) => sum + s.count, 0);
  const leadCount = stats.funnel.totalLeads;

  return { stats, vehicleCount, leadCount, newLeadCount, customerCount, activeSaleCount };
}

/**
 * Devuelve los datos del home del dashboard. Cache-aside Upstash con TTL 1h.
 * Fail-open en errores de Redis (cae a DB).
 */
export async function getDashboardHomeData(dealershipId: string): Promise<DashboardHomeData> {
  const key = dashboardHomeKey(dealershipId);

  try {
    const cached = await redis.get<DashboardHomeData>(key);
    if (cached) return cached;
  } catch (error) {
    logger.warn(undefined, "dashboard.home.cache_read_failed", {
      dealershipId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const data = await fetchDashboardHomeFromDb(dealershipId);

  try {
    await redis.set(key, data, { ex: DASHBOARD_HOME_TTL_SECONDS });
  } catch (error) {
    logger.warn(undefined, "dashboard.home.cache_write_failed", {
      dealershipId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return data;
}

/**
 * Invalida el cache del home del dashboard. Llamar desde handlers que modifiquen
 * vehículos, leads, clientes o ventas si querés que el dashboard refleje los
 * cambios al instante (si no, el TTL de 1h se ocupa).
 */
export async function invalidateDashboardHomeData(dealershipId: string): Promise<void> {
  try {
    await redis.del(dashboardHomeKey(dealershipId));
  } catch (error) {
    logger.warn(undefined, "dashboard.home.cache_invalidate_failed", {
      dealershipId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
