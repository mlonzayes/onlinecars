"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ALL_FILTER_VALUE } from "@/lib/table/query-params";
import { useTableTransition } from "@/components/dashboard/table-transition";

/**
 * Escritura de filtros y orden en la URL, compartida por todos los listados.
 *
 * Reemplaza el patrón copiado en cada módulo (sales-status-select,
 * quotations-filters), que además hardcodeaba su propia ruta. Acá usamos
 * `usePathname()`: el hook sirve para cualquier pantalla sin configurarlo.
 *
 * Reglas que centraliza, y que antes había que recordar en cada copia:
 *  - El valor "all" NO se escribe en la URL: se borra el param. URLs limpias y
 *    un solo estado canónico para "sin filtrar".
 *  - Cualquier cambio de filtro resetea `?page`. Filtrar y quedar en la página
 *    7 de un resultado que ahora tiene 2 páginas es una pantalla vacía.
 *  - Navegación con `scroll: false`: al cambiar un filtro el usuario quiere ver
 *    la tabla, no volver al header.
 */
export function useUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [localPending, localStartTransition] = useTransition();

  // Si la pantalla está dentro de un TableTransitionProvider usamos SU
  // transición, para que la tabla se entere de que hay una navegación en curso
  // y muestre el loader. Sin provider, cada consumidor usa la suya y todo
  // sigue funcionando igual (solo que sin feedback compartido).
  const shared = useTableTransition();
  const startTransition = shared?.startTransition ?? localStartTransition;
  const isPending = shared?.isPending ?? localPending;

  const push = useCallback(
    (params: URLSearchParams) => {
      params.delete("page");
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, startTransition]
  );

  /** Setea (o limpia, si es "all") un único param. */
  const setParam = useCallback(
    (param: string, value: string | null) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (value === null || value === ALL_FILTER_VALUE) params.delete(param);
      else params.set(param, value);
      push(params);
    },
    [push, searchParams]
  );

  /** Borra los params indicados de una sola navegación. */
  const clearParams = useCallback(
    (paramsToClear: string[]) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      for (const param of paramsToClear) params.delete(param);
      push(params);
    },
    [push, searchParams]
  );

  return { setParam, clearParams, isPending };
}
