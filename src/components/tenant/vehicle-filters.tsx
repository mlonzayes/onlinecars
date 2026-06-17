"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useMemo, useState, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  VEHICLE_BODY_TYPES,
  VEHICLE_BODY_TYPE_LABELS,
} from "@/lib/constants";

interface VehicleFiltersProps {
  brands: string[];
}

const MAX_SLIDER_VALUE = 50000000;
const SLIDER_STEP = 500000;

// Inputs/selects compactos: padding chico, text-sm. Antes era px-4 py-3 text-base
// (estilo "form pesado"); ahora más cercano a lo que se ve en MercadoLibre /
// AutoCosmos. Sigue siendo táctil y accesible en mobile.
const FIELD_CLASS =
  "w-full rounded-lg border border-[var(--tenant-border-strong)] bg-[var(--tenant-surface)] px-3 py-2 text-sm text-[var(--tenant-fg)] outline-none transition focus:border-[var(--tenant-primary)] focus:ring-2 focus:ring-[var(--tenant-primary)]/20";

const LABEL_CLASS =
  "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[var(--tenant-fg-muted)]";

/**
 * Hook con la lógica de filtros (URL-based). Se usa dos veces: una para el
 * panel inline de desktop, otra para el sheet de mobile. Como ambos leen y
 * escriben searchParams, el estado queda sincronizado de manera transparente.
 */
function useFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentBrand = searchParams.get("brand") ?? "";
  const currentCondition = searchParams.get("condition") ?? "";
  const currentBodyType = searchParams.get("bodyType") ?? "";
  const currentMinPrice = searchParams.get("minPrice") ?? "";
  const currentMaxPrice = searchParams.get("maxPrice") ?? "";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const current = new URLSearchParams(searchParams.toString());
      if (value) {
        current.set(key, value);
      } else {
        current.delete(key);
      }
      const qs = current.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  const commitPriceRange = useCallback(
    (value: number[]) => {
      const [min, max] = value;
      const current = new URLSearchParams(searchParams.toString());
      if (min > 0) current.set("minPrice", min.toString());
      else current.delete("minPrice");
      if (max < MAX_SLIDER_VALUE) current.set("maxPrice", max.toString());
      else current.delete("maxPrice");
      const qs = current.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  const clear = useCallback(() => {
    // Preservar el sort si existe; los filtros se limpian, el orden no.
    const current = new URLSearchParams(searchParams.toString());
    const sort = current.get("sort");
    const next = new URLSearchParams();
    if (sort) next.set("sort", sort);
    const qs = next.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const activeCount = useMemo(() => {
    let n = 0;
    if (currentBrand) n++;
    if (currentCondition) n++;
    if (currentBodyType) n++;
    if (currentMinPrice) n++;
    if (currentMaxPrice) n++;
    return n;
  }, [currentBrand, currentCondition, currentBodyType, currentMinPrice, currentMaxPrice]);

  return {
    currentBrand,
    currentCondition,
    currentBodyType,
    currentMinPrice,
    currentMaxPrice,
    updateFilter,
    commitPriceRange,
    clear,
    activeCount,
  };
}

interface FiltersPanelProps extends VehicleFiltersProps {
  // Variantes del panel:
  // - "sidebar": dentro del aside del catálogo (con card wrapper y header propio).
  // - "sheet": dentro de un Sheet de mobile (sin wrapper, el sheet ya da estructura).
  variant: "sidebar" | "sheet";
}

function FiltersPanel({ brands, variant }: FiltersPanelProps) {
  const f = useFilters();

  const [priceRange, setPriceRange] = useState([
    f.currentMinPrice ? Number(f.currentMinPrice) : 0,
    f.currentMaxPrice ? Number(f.currentMaxPrice) : MAX_SLIDER_VALUE,
  ]);

  useEffect(() => {
    setPriceRange([
      f.currentMinPrice ? Number(f.currentMinPrice) : 0,
      f.currentMaxPrice ? Number(f.currentMaxPrice) : MAX_SLIDER_VALUE,
    ]);
  }, [f.currentMinPrice, f.currentMaxPrice]);

  const wrapperClass =
    variant === "sidebar"
      ? "rounded-xl border border-[var(--tenant-border)] bg-[var(--tenant-surface)] p-4 shadow-sm"
      : "";

  return (
    <div className={wrapperClass}>
      {/* Header — solo lo mostramos en sidebar; en sheet ya hay SheetHeader. */}
      {variant === "sidebar" && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--tenant-fg)]">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </div>
          {f.activeCount > 0 && (
            <button
              type="button"
              onClick={f.clear}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[var(--tenant-fg-muted)] transition-colors hover:bg-[var(--tenant-surface-hover)] hover:text-[var(--tenant-fg)]"
            >
              <X className="h-3 w-3" />
              Limpiar
            </button>
          )}
        </div>
      )}

      {/* Fields — gap más chico que antes. En sm-only (mobile sheet) sólo 1 col;
          en sm+ con variant=sheet seguimos en 1 col porque el sheet es angosto. */}
      <div
        className={`flex flex-col gap-4 ${
          variant === "sidebar" ? "mt-4 sm:grid sm:grid-cols-2 sm:gap-x-4 lg:flex lg:flex-col" : ""
        }`}
      >
        {/* Marca */}
        <div>
          <label htmlFor={`filter-brand-${variant}`} className={LABEL_CLASS}>
            Marca
          </label>
          <select
            id={`filter-brand-${variant}`}
            value={f.currentBrand}
            onChange={(e) => f.updateFilter("brand", e.target.value)}
            className={FIELD_CLASS}
          >
            <option value="">Todas</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        {/* Condición */}
        <div>
          <label htmlFor={`filter-condition-${variant}`} className={LABEL_CLASS}>
            Condición
          </label>
          <select
            id={`filter-condition-${variant}`}
            value={f.currentCondition}
            onChange={(e) => f.updateFilter("condition", e.target.value)}
            className={FIELD_CLASS}
          >
            <option value="">Todas</option>
            <option value="new">0 km</option>
            <option value="used">Usado</option>
          </select>
        </div>

        {/* Tipo de carrocería */}
        <div>
          <label htmlFor={`filter-bodyType-${variant}`} className={LABEL_CLASS}>
            Carrocería
          </label>
          <select
            id={`filter-bodyType-${variant}`}
            value={f.currentBodyType}
            onChange={(e) => f.updateFilter("bodyType", e.target.value)}
            className={FIELD_CLASS}
          >
            <option value="">Todas</option>
            {VEHICLE_BODY_TYPES.map((b) => (
              <option key={b} value={b}>
                {VEHICLE_BODY_TYPE_LABELS[b]}
              </option>
            ))}
          </select>
        </div>

        {/* Rango de Precio */}
        <div className={variant === "sidebar" ? "sm:col-span-2 lg:col-span-1" : ""}>
          <label className={LABEL_CLASS}>Rango de precio</label>
          <div className="px-1 pt-1">
            <Slider
              min={0}
              max={MAX_SLIDER_VALUE}
              step={SLIDER_STEP}
              value={priceRange}
              onValueChange={(value) =>
                setPriceRange(Array.isArray(value) ? [...value] : [value])
              }
              onValueCommitted={(value) =>
                f.commitPriceRange(Array.isArray(value) ? [...value] : [value])
              }
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-[var(--tenant-fg-muted)]">
            <span>$ {priceRange[0].toLocaleString("es-AR")}</span>
            <span>
              {priceRange[1] >= MAX_SLIDER_VALUE
                ? `+ $ ${MAX_SLIDER_VALUE.toLocaleString("es-AR")}`
                : `$ ${priceRange[1].toLocaleString("es-AR")}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Panel de filtros para sidebar de desktop. Renderiza inline.
 */
export function VehicleFilters({ brands }: VehicleFiltersProps) {
  return <FiltersPanel brands={brands} variant="sidebar" />;
}

/**
 * Botón "Filtros" para mobile que abre un Sheet con el panel. Visible solo
 * cuando se quiere — el caller decide con `className`.
 */
export function VehicleFiltersMobileTrigger({ brands }: VehicleFiltersProps) {
  const f = useFilters();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--tenant-border-strong)] bg-[var(--tenant-surface)] px-3 py-2 text-sm font-medium text-[var(--tenant-fg)] shadow-sm transition-colors hover:bg-[var(--tenant-surface-hover)]"
          />
        }
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtros
        {f.activeCount > 0 && (
          <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--tenant-primary)] px-1.5 text-[10px] font-bold text-white">
            {f.activeCount}
          </span>
        )}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full max-w-none flex-col bg-[var(--tenant-surface)] p-0 text-[var(--tenant-fg)] data-[side=right]:w-full sm:max-w-sm"
      >
        <SheetHeader className="p-4 pb-3">
          <SheetTitle className="text-base">Filtros</SheetTitle>
        </SheetHeader>

        {/* Panel scrolleable — ocupa el alto disponible entre header y footer. */}
        <div className="flex-1 overflow-y-auto px-4">
          <FiltersPanel brands={brands} variant="sheet" />
        </div>

        {/* Footer fijo al fondo: acá vive "Limpiar" (lejos de la cruz de cerrar)
            + el botón principal para volver a los resultados. */}
        <div className="flex items-center gap-3 border-t border-[var(--tenant-border)] bg-[var(--tenant-surface)] p-4">
          {f.activeCount > 0 && (
            <button
              type="button"
              onClick={() => {
                f.clear();
                setOpen(false);
              }}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--tenant-border-strong)] px-4 py-2.5 text-sm font-medium text-[var(--tenant-fg)] transition-colors hover:bg-[var(--tenant-surface-hover)]"
            >
              <X className="h-4 w-4" />
              Limpiar
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-[var(--tenant-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
          >
            Ver resultados
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
