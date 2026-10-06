import { applySpread, getCurrentUsdRate, type EffectiveUsdRate } from "@/lib/exchange-rate";
import { assertAccountActive, type ServiceContext } from "../context";

/** Cotización de trabajo del dealer: oficial BCRA + su spread. null si no hay dato. */
export async function getDealerUsdRate(ctx: ServiceContext): Promise<EffectiveUsdRate | null> {
  assertAccountActive(ctx, "insights.usd_rate");
  const base = await getCurrentUsdRate();
  return base ? applySpread(base, Number(ctx.dealership.usdSpread)) : null;
}
