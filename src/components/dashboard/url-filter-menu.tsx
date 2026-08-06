"use client";

import { useMemo } from "react";
import { ListFilter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { ALL_FILTER_VALUE, isFilterActive, type FilterDefinition } from "@/lib/table/query-params";

interface UrlFilterMenuProps {
  filters: readonly FilterDefinition[];
  /** Valor actual de cada filtro, indexado por `param`. Resuelto en el server. */
  values: Record<string, string>;
}

/**
 * Botón único "Filtrar" con todas las categorías adentro.
 *
 * Un select por filtro llenaba la barra de ruido y no escalaba: con cinco
 * filtros la pantalla queda tapada antes de mostrar un solo dato. Agrupados en
 * un menú, la barra siempre ocupa lo mismo y el contador dice de un vistazo
 * cuántos hay activos.
 *
 * Los items son RadioItem con `closeOnClick={false}`: el menú queda abierto para
 * tocar varias categorías seguidas sin reabrirlo cada vez.
 */
export function UrlFilterMenu({ filters, values }: UrlFilterMenuProps) {
  const { setParam, clearParams } = useUrlFilters();

  const activeCount = useMemo(
    () => filters.filter((f) => isFilterActive(values[f.param] ?? ALL_FILTER_VALUE)).length,
    [filters, values]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" className="w-full justify-start sm:w-auto" />}
      >
        <ListFilter className="mr-2 h-4 w-4" />
        Filtrar
        {activeCount > 0 && (
          <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-semibold tabular-nums text-background">
            {activeCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {filters.map((filter, index) => (
          <DropdownMenuGroup key={filter.param}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel>{filter.allLabel}</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={values[filter.param] ?? ALL_FILTER_VALUE}
              onValueChange={(next) => setParam(filter.param, String(next))}
            >
              <DropdownMenuRadioItem value={ALL_FILTER_VALUE} closeOnClick={false}>
                Todos
              </DropdownMenuRadioItem>
              {filter.options.map((option) => (
                <DropdownMenuRadioItem
                  key={option.value}
                  value={option.value}
                  closeOnClick={false}
                >
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        ))}

        {activeCount > 0 && (
          <>
            <DropdownMenuSeparator />
            {/* Limpia solo los filtros: la búsqueda tiene su propia X en el input. */}
            <DropdownMenuItem onClick={() => clearParams(filters.map((f) => f.param))}>
              <X className="mr-1 h-3.5 w-3.5" />
              Limpiar filtros
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
