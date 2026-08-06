import { revalidateTag } from "next/cache";
import { invalidateTenantHomeBundle } from "@/lib/tenant";

/**
 * Tags de `unstable_cache` usados por los listados del panel.
 *
 * Cada listado que cachea sus stats declara su tag acá, y TODO handler que mute
 * ese recurso tiene que invalidarlo. Un stat card desactualizado es peor que uno
 * lento: el dealer toma decisiones mirando esos números.
 */
export const CACHE_TAGS = {
  vehiclesStats: "vehicles-stats",
  salesStats: "sales-stats",
  customersStats: "customers-stats",
  quotationsStats: "quotations-stats",
} as const;

/**
 * Invalida todo lo que depende del stock de vehículos: los stats del panel y
 * el bundle cacheado de la home pública del tenant.
 *
 * Existe como un solo llamado para que no haya forma de acordarse de uno y
 * olvidarse del otro. Usarlo en TODO handler que cree, edite, publique, cambie
 * de estado o elimine un vehículo.
 */
export async function invalidateVehicleCaches(dealershipSlug: string): Promise<void> {
  revalidateTag(CACHE_TAGS.vehiclesStats);
  await invalidateTenantHomeBundle(dealershipSlug);
}

/**
 * Para los handlers de VENTAS: una venta sincroniza el status del vehículo
 * (reservado/vendido), así que mueve los stats de ambos listados.
 */
export async function invalidateSaleCaches(dealershipSlug: string): Promise<void> {
  revalidateTag(CACHE_TAGS.salesStats);
  await invalidateVehicleCaches(dealershipSlug);
}
