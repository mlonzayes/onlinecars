import type { Vehicle } from "@prisma/client";
import { getTenantPublicUrl } from "@/lib/tenant";
import { panelVehicleUrl, type McpContext } from "../context";

// Lo que la IA ve de un vehículo. Campos elegidos uno por uno (nunca un spread
// del modelo) y montos como string para no perder precisión del Decimal.
export function toVehicleView(ctx: McpContext, v: Vehicle) {
  const published = v.publishedAt !== null;
  return {
    id: v.id,
    titulo: v.title,
    marca: v.brand,
    modelo: v.model,
    anio: v.year,
    precio: v.price.toString(),
    moneda: v.currency,
    precioCompra: v.costPrice?.toString() ?? null,
    monedaCompra: v.costCurrency,
    kilometros: v.kilometers,
    combustible: v.fuelType,
    transmision: v.transmission,
    carroceria: v.bodyType,
    color: v.color,
    puertas: v.doors,
    motor: v.engine,
    patente: v.licensePlate,
    condicion: v.condition,
    estado: v.status,
    publicado: published,
    descripcion: v.description,
    linkPanel: panelVehicleUrl(ctx, v.id),
    linkPublico: published ? `${getTenantPublicUrl(ctx.dealership)}/vehiculo/${v.publicSlug}` : null,
  };
}

/** Versión corta para listados: lo justo para identificar y elegir. */
export function toVehicleListItem(ctx: McpContext, v: Vehicle) {
  return {
    id: v.id,
    titulo: v.title,
    anio: v.year,
    precio: v.price.toString(),
    moneda: v.currency,
    kilometros: v.kilometers,
    patente: v.licensePlate,
    estado: v.status,
    publicado: v.publishedAt !== null,
    linkPanel: panelVehicleUrl(ctx, v.id),
  };
}
