"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowDownWideNarrow } from "lucide-react";
import type { PublicVehicleSort } from "@/lib/tenant";

interface SortOption {
  value: PublicVehicleSort;
  label: string;
}

const OPTIONS: SortOption[] = [
  { value: "recent", label: "Más recientes" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "km_asc", label: "Menos kilómetros" },
  { value: "year_desc", label: "Año más nuevo" },
];

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get("sort") as PublicVehicleSort) ?? "recent";

  function handleChange(value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "recent" || !value) {
      next.delete("sort"); // default — no ensuciamos la URL
    } else {
      next.set("sort", value);
    }
    const qs = next.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  return (
    <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm">
      <ArrowDownWideNarrow className="h-3.5 w-3.5 text-slate-400" />
      <span className="hidden text-xs font-semibold uppercase tracking-wide text-slate-500 sm:inline">
        Ordenar
      </span>
      <select
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className="bg-transparent text-sm font-medium text-slate-700 outline-none"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
