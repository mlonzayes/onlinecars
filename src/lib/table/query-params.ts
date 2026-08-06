/**
 * Contratos compartidos de filtros y ordenamiento para los listados del panel.
 *
 * La idea es que cada módulo (vehículos, ventas, clientes, leads, cotizaciones)
 * DECLARE sus filtros y sus criterios de orden, y que toda la mecánica —leer la
 * URL, validar, resetear la paginación, pintar los selects— sea común.
 *
 * Regla de oro: lo que viene de la URL es input del usuario. Nunca se le pasa
 * a Prisma sin pasar por una whitelist. Ver `resolveSort`.
 */

/** Valor sentinela del "sin filtrar". No se escribe en la URL: se borra el param. */
export const ALL_FILTER_VALUE = "all";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDefinition {
  /** Nombre del query param en la URL (ej: "status"). */
  param: string;
  /** Texto del trigger cuando no hay nada elegido (ej: "Todos los estados"). */
  allLabel: string;
  /** Opciones concretas. NO incluir la de "todos": se agrega sola. */
  options: readonly FilterOption[];
}

/**
 * Criterio de orden. El `orderBy` es un objeto de Prisma escrito por nosotros
 * en el código; el usuario solo elige un `value` de esta lista cerrada.
 *
 * Genérico en TOrderBy para que cada módulo lo tipe con su propio
 * `Prisma.XOrderByWithRelationInput` y el compilador valide los campos.
 */
export interface SortOption<TOrderBy> {
  value: string;
  label: string;
  orderBy: TOrderBy;
}

export interface SortDefinition<TOrderBy> {
  param: string;
  options: readonly SortOption<TOrderBy>[];
  /** `value` que se usa cuando la URL no trae nada o trae algo inválido. */
  defaultValue: string;
}

/** Opción de orden sin el `orderBy`: es lo único que necesita el cliente. */
export interface ClientSortOption {
  value: string;
  label: string;
}

/**
 * Adelgaza las opciones de orden para pasarlas a un Client Component.
 *
 * Mantiene los objetos `orderBy` de Prisma fuera del bundle del browser: el
 * cliente solo elige un `value` y el servidor lo traduce con `resolveSort`.
 */
export function toClientSortOptions<TOrderBy>(
  definition: SortDefinition<TOrderBy>
): ClientSortOption[] {
  return definition.options.map(({ value, label }) => ({ value, label }));
}

/**
 * Resuelve el ordenamiento pedido en la URL contra la lista permitida.
 *
 * ESTA FUNCIÓN ES LA BARRERA DE SEGURIDAD del ordenamiento. Nunca construyas un
 * `orderBy` interpolando lo que viene del query string: un `?sort=` malicioso o
 * simplemente mal tipeado puede hacer que Prisma ordene por una relación cara,
 * rompa en runtime, o filtre datos por un campo que no queríamos exponer.
 * Acá el valor de la URL solo sirve para BUSCAR en una lista que escribimos
 * nosotros; si no matchea, cae al default y listo.
 */
export function resolveSort<TOrderBy>(
  raw: string | undefined,
  definition: SortDefinition<TOrderBy>
): { value: string; orderBy: TOrderBy } {
  const match = definition.options.find((o) => o.value === raw);
  const fallback =
    definition.options.find((o) => o.value === definition.defaultValue) ?? definition.options[0];
  const chosen = match ?? fallback;
  return { value: chosen.value, orderBy: chosen.orderBy };
}

/**
 * Normaliza el valor de un filtro contra sus opciones válidas.
 * Devuelve ALL_FILTER_VALUE si la URL no trae nada o trae algo desconocido,
 * así el select siempre tiene un valor consistente que mostrar.
 */
export function resolveFilter(raw: string | undefined, definition: FilterDefinition): string {
  if (!raw) return ALL_FILTER_VALUE;
  return definition.options.some((o) => o.value === raw) ? raw : ALL_FILTER_VALUE;
}

/** True si el filtro está efectivamente acotando resultados. */
export function isFilterActive(value: string): boolean {
  return value !== ALL_FILTER_VALUE;
}

/** Página válida (>= 1) a partir del query param. */
export function parsePage(raw: string | undefined): number {
  if (!raw) return 1;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * Tokeniza un texto de búsqueda. Cada token después se exige por AND, con OR
 * entre los campos relevantes — así "toyota 2023" matchea marca Y año.
 */
export function searchTokens(search: string | undefined): string[] {
  if (!search) return [];
  return search.trim().split(/\s+/).filter(Boolean);
}
