"use client";

import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUrlFilters } from "@/hooks/use-url-filters";
import type { ClientSortOption } from "@/lib/table/query-params";

interface UrlSortMenuProps {
  param: string;
  /** Opciones SIN el orderBy: al cliente solo le llega qué mostrar y qué mandar. */
  options: readonly ClientSortOption[];
  value: string;
}

/**
 * Botón "Ordenar" con todos los criterios disponibles.
 *
 * El `orderBy` de Prisma NO llega acá a propósito: el cliente manda un `value`
 * de la lista y el servidor lo traduce con `resolveSort`. Así la forma de las
 * queries no viaja en el bundle y el browser no puede proponer un orden que no
 * esté en la whitelist.
 *
 * A diferencia de los filtros, acá el item SÍ cierra el menú: se ordena por un
 * criterio a la vez, elegir uno es la acción final.
 */
export function UrlSortMenu({ param, options, value }: UrlSortMenuProps) {
  const { setParam } = useUrlFilters();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" className="w-full justify-start sm:w-auto" />}
      >
        <ArrowUpDown className="mr-2 h-4 w-4" />
        Ordenar
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => setParam(param, String(next))}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
