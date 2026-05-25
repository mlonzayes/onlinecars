/**
 * GET /api/cron/expire-trials
 *
 * Cron diario que marca como "expired" los dealerships cuyo trial venció.
 * Solo afecta los que estén en status "trial" — los "active", "suspended" o
 * ya "expired" se dejan como están.
 *
 * Seguridad: Vercel manda el header `Authorization: Bearer ${CRON_SECRET}` en
 * cada invocación del cron. Validamos contra la env var CRON_SECRET para
 * evitar que cualquiera pueda dispararlo desde fuera.
 *
 * Schedule: ver vercel.json — corre diario a las 02:00 UTC.
 */
import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const GET = withLogger(async (request, { requestId }) => {
  // Validar el secret del cron. Vercel lo inyecta automáticamente como
  // `Authorization: Bearer <CRON_SECRET>` en cron jobs configurados.
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    logger.error(requestId, "cron.expire_trials.misconfigured", {
      reason: "CRON_SECRET no está definido en env",
    });
    return NextResponse.json({ error: "Cron no configurado" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${expected}`) {
    logger.warn(requestId, "cron.expire_trials.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();

  const result = await prisma.dealership.updateMany({
    where: {
      subscriptionStatus: "trial",
      trialEndsAt: { lt: now },
    },
    data: { subscriptionStatus: "expired" },
  });

  logger.info(requestId, "cron.expire_trials.ok", {
    expired: result.count,
    at: now.toISOString(),
  });

  return NextResponse.json({ expired: result.count });
});
