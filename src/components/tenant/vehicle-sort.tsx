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
    <div className="flex items-center gap-2">
      <label htmlFor="sort-select" className="text-sm font-medium text-[var(--tenant-fg-muted)]">
        Ordenar por:
      </label>
      <select
        id="sort-select"
        value={currentSort}
        onChange={handleChange}
        className="rounded-lg border border-[var(--tenant-border-strong)] bg-[var(--tenant-surface)] text-[var(--tenant-fg)] py-2 pl-3 pr-8 text-sm font-medium focus:border-[var(--tenant-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--tenant-primary)]/20"
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
