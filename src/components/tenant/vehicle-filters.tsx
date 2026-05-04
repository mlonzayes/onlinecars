"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  VEHICLE_BODY_TYPES,
  VEHICLE_BODY_TYPE_LABELS,
} from "@/lib/constants";

interface VehicleFiltersProps {
  brands: string[];
}

const MAX_SLIDER_VALUE = 50000000;
const SLIDER_STEP = 500000;

// Tailwind class compartida para todos los selects/inputs del panel.
// Centraliza el estilo y mantiene consistencia visual.
const FIELD_CLASS =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-[var(--tenant-primary)] focus:ring-2 focus:ring-[var(--tenant-primary)]/20";

const LABEL_CLASS =
  "mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500";

export function VehicleFilters({ brands }: VehicleFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentBrand = searchParams.get("brand") ?? "";
  const currentCondition = searchParams.get("condition") ?? "";
  const currentBodyType = searchParams.get("bodyType") ?? "";
  const currentMinPrice = searchParams.get("minPrice") ?? "";
  const currentMaxPrice = searchParams.get("maxPrice") ?? "";

  const [priceRange, setPriceRange] = useState([
    currentMinPrice ? Number(currentMinPrice) : 0,
    currentMaxPrice ? Number(currentMaxPrice) : MAX_SLIDER_VALUE,
  ]);

  // Sync el slider con la URL si cambia desde afuera (ej. limpiar filtros).
  useEffect(() => {
    setPriceRange([
      currentMinPrice ? Number(currentMinPrice) : 0,
      currentMaxPrice ? Number(currentMaxPrice) : MAX_SLIDER_VALUE,
    ]);
  }, [currentMinPrice, currentMaxPrice]);

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

  function handlePriceCommit(value: number[]) {
    const [min, max] = value;
    const current = new URLSearchParams(searchParams.toString());

    if (min > 0) current.set("minPrice", min.toString());
    else current.delete("minPrice");

    if (max < MAX_SLIDER_VALUE) current.set("maxPrice", max.toString());
    else current.delete("maxPrice");

    const qs = current.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  function clearFilters() {
    // Preservar el sort si existe; los filtros se limpian, el orden no.
    const current = new URLSearchParams(searchParams.toString());
    const sort = current.get("sort");
    const next = new URLSearchParams();
    if (sort) next.set("sort", sort);
    const qs = next.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  const hasActiveFilters =
    currentBrand ||
    currentCondition ||
    currentBodyType ||
    currentMinPrice ||
    currentMaxPrice;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <SlidersHorizontal className="h-5 w-5" />
          Filtros
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-3 w-3" />
            Limpiar
          </button>
        )}
      </div>

      {/* Fields */}
      <div className="mt-6 flex flex-col gap-6 sm:grid sm:grid-cols-2 sm:gap-x-6 lg:flex lg:flex-col lg:gap-8">
        {/* Marca */}
        <div>
          <label htmlFor="filter-brand" className={LABEL_CLASS}>
            Marca
          </label>
          <select
            id="filter-brand"
            value={currentBrand}
            onChange={(e) => updateFilter("brand", e.target.value)}
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
          <label htmlFor="filter-condition" className={LABEL_CLASS}>
            Condición
          </label>
          <select
            id="filter-condition"
            value={currentCondition}
            onChange={(e) => updateFilter("condition", e.target.value)}
            className={FIELD_CLASS}
          >
            <option value="">Todas</option>
            <option value="new">0 km</option>
            <option value="used">Usado</option>
          </select>
        </div>

        {/* Tipo de carrocería */}
        <div>
          <label htmlFor="filter-bodyType" className={LABEL_CLASS}>
            Carrocería
          </label>
          <select
            id="filter-bodyType"
            value={currentBodyType}
            onChange={(e) => updateFilter("bodyType", e.target.value)}
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
        <div className="sm:col-span-2 lg:col-span-1">
          <label className={LABEL_CLASS}>Rango de precio</label>
          <div className="px-1 pt-2">
            <Slider
              min={0}
              max={MAX_SLIDER_VALUE}
              step={SLIDER_STEP}
              value={priceRange}
              onValueChange={setPriceRange}
              onValueCommitted={handlePriceCommit}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-600">
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
