import "server-only";
import { prisma } from "@/lib/prisma";

// Cotización oficial USD/ARS publicada por el BCRA (API pública, sin token).
// Fuente: https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones/USD
// Devuelve `tipoCotizacion` como valor de referencia (no hay compra/venta separados).

const BCRA_USD_URL =
  "https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones/USD";

// 6 horas. El BCRA publica una vez por día hábil; no tiene sentido pegarle seguido.
const RATE_REVALIDATE_SECONDS = 6 * 60 * 60;

export interface OfficialUsdRate {
  rate: number;
  // Fecha del dato publicado por el BCRA (ISO "YYYY-MM-DD"). Puede ser anterior a
  // hoy: findes, feriados o si el dato del día todavía no se publicó.
  date: string | null;
}

// Shape parcial de la respuesta del BCRA — solo lo que consumimos.
interface BcraCotizacionResponse {
  results?: Array<{
    fecha?: string;
    detalle?: Array<{ codigoMoneda?: string; tipoCotizacion?: number }>;
  }>;
}

// Obtiene la cotización oficial del dólar. Fail-safe: devuelve null si la API
// falla o responde algo inesperado — el caller decide qué mostrar (nada, en
// nuestro caso). Cacheado con revalidate para no pegarle al BCRA en cada request.
export async function getOfficialUsdRate(): Promise<OfficialUsdRate | null> {
  try {
    const res = await fetch(BCRA_USD_URL, {
      next: { revalidate: RATE_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as BcraCotizacionResponse;
    const result = json.results?.[0];
    const detail = result?.detalle?.find((d) => d.codigoMoneda === "USD");
    const rate = detail?.tipoCotizacion;

    if (typeof rate !== "number" || rate <= 0) return null;

    return { rate, date: typeof result?.fecha === "string" ? result.fecha : null };
  } catch {
    return null;
  }
}

// Convierte una fecha ISO "YYYY-MM-DD" del BCRA a un Date a medianoche UTC,
// apto para una columna @db.Date. Evita corrimientos por timezone.
function parseRateDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

// Persiste la cotización oficial del día en la tabla global ExchangeRate.
// Idempotente: upsert por (currency, date), así re-correr el cron el mismo día
// solo refresca el valor. Devuelve la cotización guardada o null si el BCRA falló.
export async function syncOfficialUsdRate(): Promise<OfficialUsdRate | null> {
  const rate = await getOfficialUsdRate();
  if (!rate || !rate.date) return null;

  const date = parseRateDate(rate.date);
  await prisma.exchangeRate.upsert({
    where: { currency_date: { currency: "USD", date } },
    create: { currency: "USD", rate: rate.rate, date, source: "bcra" },
    update: { rate: rate.rate, fetchedAt: new Date() },
  });

  return rate;
}

// Lee la última cotización guardada en la tabla (la más reciente por fecha).
function rowToRate(row: { rate: unknown; date: Date }): OfficialUsdRate {
  return { rate: Number(row.rate), date: row.date.toISOString().slice(0, 10) };
}

export async function getStoredUsdRate(): Promise<OfficialUsdRate | null> {
  const row = await prisma.exchangeRate.findFirst({
    where: { currency: "USD" },
    orderBy: { date: "desc" },
  });
  return row ? rowToRate(row) : null;
}

// Cotización vigente para mostrar/usar: primero la guardada (rápida, sin red),
// y si la tabla está vacía (el cron todavía no corrió), fallback al fetch en vivo.
export async function getCurrentUsdRate(): Promise<OfficialUsdRate | null> {
  const stored = await getStoredUsdRate();
  if (stored) return stored;
  return getOfficialUsdRate();
}

export interface EffectiveUsdRate {
  base: number; // cotización oficial del BCRA
  spread: number; // plus en pesos del dealer
  effective: number; // base + spread — la cotización de trabajo del dealer
  date: string | null;
}

// Aplica el spread del dealer sobre la base. El valor efectivo se calcula acá,
// nunca se persiste sumado (la base es global, el spread es por tenant).
export function applySpread(
  rate: OfficialUsdRate,
  spread: number | null | undefined,
): EffectiveUsdRate {
  const s = typeof spread === "number" && Number.isFinite(spread) ? spread : 0;
  return { base: rate.rate, spread: s, effective: rate.rate + s, date: rate.date };
}
