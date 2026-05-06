import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";
import { logger } from "./logger";

// Sliding window porque evita el patrón "ráfaga al final + ráfaga al principio
// del siguiente bucket" que sufren los fixed windows. Mismo costo: 1 Redis call
// por chequeo.
//
// El "prefix" namespacea las keys en Redis para que distintos limiters no se
// pisen aunque compartan la misma key (ej: misma IP+slug en leads y reviews).

export const publicLeadsLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 m"),
  prefix: "rl:public:leads",
  analytics: false,
});

export const publicReviewsLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "30 m"),
  prefix: "rl:public:reviews",
  analytics: false,
});

export const publicVehiclesLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  prefix: "rl:public:vehicles",
  analytics: false,
});

export const waitlistLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "30 m"),
  prefix: "rl:waitlist",
  analytics: false,
});

// Extrae la IP del cliente. En Vercel el header confiable es x-forwarded-for
// (la primera IP del array — el resto son proxies intermedios). En local
// puede venir vacío o como ::1.
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export interface RateLimitResult {
  ok: boolean;
  headers: Record<string, string>;
  retryAfterSeconds?: number;
}

// Aplica el rate limit y devuelve un resultado consistente.
// Fail-open: si Upstash está caído o tira error, dejamos pasar la request
// pero logeamos. Razón: preferimos un servicio funcional sin rate limit a un
// servicio caído entero porque Redis tuvo un hiccup.
export async function applyRateLimit(
  limiter: Ratelimit,
  key: string,
  requestId: string,
  context: Record<string, unknown> = {}
): Promise<RateLimitResult> {
  try {
    const { success, limit, remaining, reset } = await limiter.limit(key);

    const headers: Record<string, string> = {
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
    };

    if (!success) {
      // reset viene en ms epoch — el header Retry-After es segundos a esperar.
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      headers["Retry-After"] = String(retryAfter);
      logger.warn(requestId, "ratelimit.blocked", { key, limit, retryAfter, ...context });
      return { ok: false, headers, retryAfterSeconds: retryAfter };
    }

    return { ok: true, headers };
  } catch (error) {
    logger.error(requestId, "ratelimit.check_failed", {
      key,
      error: error instanceof Error ? error.message : String(error),
      ...context,
    });
    return { ok: true, headers: {} };
  }
}
