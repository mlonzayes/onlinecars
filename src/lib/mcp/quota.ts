import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";
import { getMcpDailyCalls } from "@/lib/plans";
import type { ServiceContext } from "@/lib/services/context";

// Cupo diario de tools del MCP por concesionario (ver `mcpDailyCalls` en
// plans.ts). Cuenta solo las llamadas que terminan bien: un error de validación
// o de permisos no le come cupo al dealer. El abuso lo frena `mcpLimiter`.
//
// Fail-open como el rate limit: si Redis se cae, se deja pasar y se loggea.

const QUOTA_TTL_SECONDS = 60 * 60 * 48;

// "Hoy" en la zona horaria del dealer: el cupo se renueva a su medianoche.
function quotaKey(ctx: ServiceContext): string {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: ctx.dealership.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return `mcp:quota:${ctx.dealership.id}:${day}`;
}

export interface QuotaStatus {
  ok: boolean;
  limit: number;
}

export async function checkMcpQuota(ctx: ServiceContext): Promise<QuotaStatus> {
  const limit = getMcpDailyCalls(ctx.dealership);
  if (!Number.isFinite(limit)) return { ok: true, limit };

  try {
    const used = (await redis.get<number>(quotaKey(ctx))) ?? 0;
    return { ok: used < limit, limit };
  } catch (error) {
    logger.warn(ctx.requestId, "mcp.quota.read_failed", {
      dealershipId: ctx.dealership.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: true, limit };
  }
}

export async function consumeMcpQuota(ctx: ServiceContext): Promise<void> {
  if (!Number.isFinite(getMcpDailyCalls(ctx.dealership))) return;

  const key = quotaKey(ctx);
  try {
    const used = await redis.incr(key);
    if (used === 1) await redis.expire(key, QUOTA_TTL_SECONDS);
  } catch (error) {
    logger.warn(ctx.requestId, "mcp.quota.write_failed", {
      dealershipId: ctx.dealership.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
