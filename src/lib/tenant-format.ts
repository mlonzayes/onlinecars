/**
 * Formateo de datos de vehículo para el sitio público.
 *
 * Existe para que los bloques del template "prestige" no re-implementen el
 * formato de precio: `vehicle-card.tsx` tiene su propia copia local (previa a
 * este módulo) y conviene que converjan acá cuando se toque esa card.
 */

/**
 * Precio en formato local. Acepta `unknown` porque el precio llega como Decimal
 * del Prisma client en algunos paths y como string serializado en otros (el
 * bundle del home lo serializa con .toString()).
 */
export function formatVehiclePrice(price: unknown, currency: string): string {
  const num = typeof price === "string" ? parseFloat(price) : Number(price);
  if (isNaN(num)) return "Consultar";

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatVehicleKm(km: number | null): string {
  if (km == null) return "—";
  if (km === 0) return "0 km";
  return `${km.toLocaleString("es-AR")} km`;
}

/** Capitaliza un valor de enum suelto (fuelType, transmission) para mostrarlo. */
export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
