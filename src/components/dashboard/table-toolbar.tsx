"use client";

import { UrlFilterMenu } from "./url-filter-menu";
import { UrlSortMenu } from "./url-sort-menu";
import type { ClientSortOption, FilterDefinition } from "@/lib/table/query-params";

interface TableToolbarProps {
  /** El buscador del listado (normalmente `<TableSearch />`). Ocupa el ancho libre. */
  children?: React.ReactNode;
  /** Filtros a ofrecer dentro del botón "Filtrar". */
  filters: readonly FilterDefinition[];
  /** Valor actual de cada filtro, indexado por `param`. */
  values: Record<string, string>;
  sort: {
    param: string;
    options: readonly ClientSortOption[];
    value: string;
  };
}

/**
 * Barra de un listado del panel: búsqueda + "Filtrar" + "Ordenar", todo en la
 * misma fila.
 *
 * Se configura por props, no por módulo: para reusarla en clientes, ventas o
 * leads solo hay que pasarle otras `FilterDefinition`. No conoce ninguna ruta
 * —el hook usa `usePathname()`— ni ningún campo de Prisma.
 *
 * En mobile los tres elementos se apilan a ancho completo; desde `sm` la
 * búsqueda se estira y los botones quedan fijos a la derecha.
 */
export function TableToolbar({ children, filters, values, sort }: TableToolbarProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {children && <div className="min-w-0 flex-1">{children}</div>}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <UrlFilterMenu filters={filters} values={values} />
        <UrlSortMenu param={sort.param} options={sort.options} value={sort.value} />
      </div>
    </div>
  );
}
