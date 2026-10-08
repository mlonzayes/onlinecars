import type { Prisma } from "@prisma/client";
import {
  isFilterActive,
  searchTokens,
  type FilterDefinition,
  type SortDefinition,
} from "./query-params";

/**
 * Filtros y orden del listado de /dashboard/portales/mercadolibre: el stock
 * disponible del dealer cruzado con su estado en Mercado Libre.
 */

export const ML_STATE_FILTER: FilterDefinition = {
  param: "ml",
  allLabel: "Todos los estados en ML",
  options: [
    { value: "none", label: "Sin publicar en ML" },
    { value: "active", label: "Publicados" },
    { value: "payment_required", label: "Pendientes de pago" },
    { value: "paused", label: "Pausados" },
    { value: "error", label: "Con error" },
  ],
};

export const ML_VEHICLE_FILTERS = [ML_STATE_FILTER] as const;

export const ML_VEHICLE_SORT: SortDefinition<Prisma.VehicleOrderByWithRelationInput> = {
  param: "sort",
  defaultValue: "recent",
  options: [
    { value: "recent", label: "Más recientes primero", orderBy: { createdAt: "desc" } },
    { value: "oldest", label: "Más tiempo en stock", orderBy: { createdAt: "asc" } },
    { value: "year-desc", label: "Año: más nuevo", orderBy: { year: "desc" } },
  ],
};

export function buildMLVehicleWhere({
  dealershipId,
  search,
  mlState,
}: {
  dealershipId: string;
  search: string;
  mlState: string;
}): Prisma.VehicleWhereInput {
  const tokens = searchTokens(search);

  // "Sin publicar" incluye los cerrados: se pueden volver a publicar.
  const mlWhere: Prisma.VehicleWhereInput = !isFilterActive(mlState)
    ? {}
    : mlState === "none"
      ? { OR: [{ mlListing: null }, { mlListing: { status: "closed" } }] }
      : { mlListing: { status: mlState } };

  return {
    dealershipId,
    // Solo stock vendible: un reservado o vendido no se publica.
    status: "available",
    ...mlWhere,
    ...(tokens.length > 0
      ? {
          AND: tokens.map((token) => ({
            OR: [
              { title: { contains: token, mode: "insensitive" as const } },
              { brand: { contains: token, mode: "insensitive" as const } },
              { model: { contains: token, mode: "insensitive" as const } },
              { licensePlate: { contains: token, mode: "insensitive" as const } },
            ],
          })),
        }
      : {}),
  };
}
