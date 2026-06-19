/**
 * GET /api/cron/sync-exchange-rate
 *
 * Cron diario que trae la cotización oficial USD/ARS del BCRA y la persiste en
 * la tabla global ExchangeRate (upsert por día). El "plus" de cada concesionario
 * (Dealership.usdSpread) NO se aplica acá — la base es global y compartida.
 *
 * Seguridad: igual que el resto de los crons, Vercel manda
 * `Authorization: Bearer ${CRON_SECRET}`. Validamos contra la env var.
 *
 * Schedule: ver vercel.json. El BCRA publica durante la mañana hábil; corremos
 * pasado el mediodía AR para tomar el dato del día. Findes/feriados no publican:
 * el upsert simplemente no cambia nada y la última cotización guardada se mantiene.
 */
import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { syncOfficialUsdRate } from "@/lib/exchange-rate";

export const GET = withLogger(async (request, { requestId }) => {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    logger.error(requestId, "cron.sync_exchange_rate.misconfigured", {
      reason: "CRON_SECRET no está definido en env",
    });
    return NextResponse.json({ error: "Cron no configurado" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${expected}`) {
    logger.warn(requestId, "cron.sync_exchange_rate.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rate = await syncOfficialUsdRate();

  if (!rate) {
    // El BCRA no respondió o no había dato. No es un 500 nuestro: la última
    // cotización guardada sigue vigente. Avisamos para monitoreo.
    logger.warn(requestId, "cron.sync_exchange_rate.no_data");
    return NextResponse.json({ synced: false });
  }

  logger.info(requestId, "cron.sync_exchange_rate.ok", {
    rate: rate.rate,
    date: rate.date,
  });
  return NextResponse.json({ synced: true, rate: rate.rate, date: rate.date });
});
