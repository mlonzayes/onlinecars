import type { Prisma } from "@prisma/client";
import {
  VEHICLE_CONDITIONS,
  VEHICLE_CONDITION_LABELS,
  VEHICLE_STATUSES,
  VEHICLE_STATUS_LABELS,
} from "@/lib/constants";
import {
  isFilterActive,
  searchTokens,
  type FilterDefinition,
  type SortDefinition,
} from "./query-params";

/**
 * Declaración de filtros y ordenamiento del listado de vehículos.
 *
 * Este archivo es el modelo a copiar para los demás módulos: la pantalla no
 * decide nada, solo lee de acá. Ver `.claude/rules/table-filters.md`.
 */

export const VEHICLE_STATUS_FILTER: FilterDefinition = {
  param: "status",
  allLabel: "Todos los estados",
  // Derivadas de constants.ts: si mañana se agrega un estado, aparece solo.
  options: VEHICLE_STATUSES.map((value) => ({ value, label: VEHICLE_STATUS_LABELS[value] })),
};

export const VEHICLE_PUBLICATION_FILTER: FilterDefinition = {
  param: "published",
  allLabel: "Publicados y borradores",
  options: [
    { value: "yes", label: "Solo publicados" },
    { value: "no", label: "Solo borradores" },
  ],
};

export const VEHICLE_CONDITION_FILTER: FilterDefinition = {
  param: "condition",
  allLabel: "Nuevos y usados",
  options: VEHICLE_CONDITIONS.map((value) => ({ value, label: VEHICLE_CONDITION_LABELS[value] })),
};

export const VEHICLE_FILTERS = [
  VEHICLE_STATUS_FILTER,
  VEHICLE_PUBLICATION_FILTER,
  VEHICLE_CONDITION_FILTER,
] as const;

/**
 * Criterios de orden permitidos.
 *
 * OJO con "Precio": ordena por el número crudo, sin convertir monedas. Un auto
 * de USD 30.000 se ordena como "más barato" que uno de ARS 30.000.000 porque 30
 * mil es menos que 30 millones. Convertir requeriría la cotización del dealer
 * (`applySpread` + `getCurrentUsdRate`) dentro del SQL, que hoy no se puede.
 * Mientras tanto: si el dealer mezcla monedas, que filtre o mire el valor.
 */
export const VEHICLE_SORT: SortDefinition<Prisma.VehicleOrderByWithRelationInput> = {
  param: "sort",
  defaultValue: "recent",
  options: [
    { value: "recent", label: "Más recientes primero", orderBy: { createdAt: "desc" } },
    { value: "oldest", label: "Más tiempo en stock", orderBy: { createdAt: "asc" } },
    { value: "price-desc", label: "Precio: mayor a menor", orderBy: { price: "desc" } },
    { value: "price-asc", label: "Precio: menor a mayor", orderBy: { price: "asc" } },
    { value: "year-desc", label: "Año: más nuevo", orderBy: { year: "desc" } },
    { value: "year-asc", label: "Año: más viejo", orderBy: { year: "asc" } },
    // nulls last: un vehículo sin km cargados no debería encabezar el listado.
    {
      value: "km-asc",
      label: "Menos kilómetros",
      orderBy: { kilometers: { sort: "asc", nulls: "last" } },
    },
  ],
};

export interface VehicleWhereParams {
  dealershipId: string;
  search: string;
  status: string;
  published: string;
  condition: string;
}

/**
 * Arma el `where` de Prisma combinando búsqueda y filtros.
 *
 * Cada filtro se suma solo si está activo, así una pantalla sin filtros produce
 * el mismo `where` mínimo de siempre (y permite derivar el total del cache en
 * lugar de correr un count — ver el patrón de stats cacheados en CLAUDE.md).
 */
export function buildVehicleWhere({
  dealershipId,
  search,
  status,
  published,
  condition,
}: VehicleWhereParams): Prisma.VehicleWhereInput {
  const tokens = searchTokens(search);

  return {
    dealershipId,
    ...(tokens.length > 0
      ? {
          AND: tokens.map((token) => ({
            OR: [
              { title: { contains: token, mode: "insensitive" as const } },
              { brand: { contains: token, mode: "insensitive" as const } },
              { model: { contains: token, mode: "insensitive" as const } },
              { licensePlate: { contains: token, mode: "insensitive" as const } },
              { vin: { contains: token, mode: "insensitive" as const } },
            ],
          })),
        }
      : {}),
    ...(isFilterActive(status) ? { status } : {}),
    ...(isFilterActive(condition) ? { condition } : {}),
    // "published" no es una columna: se deriva de publishedAt.
    ...(isFilterActive(published)
      ? { publishedAt: published === "yes" ? { not: null } : null }
      : {}),
  };
}

/** True si hay algún filtro o búsqueda activos (sirve para el botón "Limpiar"). */
export function hasActiveVehicleFilters(params: {
  search: string;
  status: string;
  published: string;
  condition: string;
}): boolean {
  return (
    params.search.trim().length > 0 ||
    isFilterActive(params.status) ||
    isFilterActive(params.published) ||
    isFilterActive(params.condition)
  );
}
