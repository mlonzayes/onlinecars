"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { type ChangeEvent } from "react";

export function VehicleSort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // default is 'recent'
  const currentSort = searchParams.get("sort") || "recent";

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (newSort === "recent") {
      params.delete("sort");
    } else {
      params.set("sort", newSort);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
      {/* En mobile ocultamos el label para no robarle ancho al select. */}
      <label
        htmlFor="sort-select"
        className="hidden shrink-0 text-sm font-medium text-[var(--tenant-fg-muted)] sm:inline"
      >
        Ordenar por:
      </label>
      <select
        id="sort-select"
        value={currentSort}
        onChange={handleChange}
        className="min-w-0 flex-1 rounded-lg border border-[var(--tenant-border-strong)] bg-[var(--tenant-surface)] py-2 pl-3 pr-8 text-sm font-medium text-[var(--tenant-fg)] focus:border-[var(--tenant-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--tenant-primary)]/20 sm:flex-none"
      >
        <option value="recent">Destacados</option>
        <option value="price_asc">Precio: Menor a Mayor</option>
        <option value="price_desc">Precio: Mayor a Menor</option>
        <option value="km_asc">Menos km</option>
        <option value="year_desc">Más nuevos (Año)</option>
      </select>
    </div>
  );
}
