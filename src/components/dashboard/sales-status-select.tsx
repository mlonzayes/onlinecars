"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "all", label: "Todos los estados" },
  { value: "active", label: "En curso" },
  { value: "completed", label: "Completadas" },
  { value: "cancelled", label: "Canceladas" },
] as const;

const STATUS_LABEL_BY_VALUE: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label])
);

interface SalesStatusSelectProps {
  value: string;
}

/**
 * Filtro de estado del listado de ventas. Sincroniza la selección con la URL
 * (?status=...) para que sea bookmarkable y para que el server pueda hacer
 * el filtro en SQL. Resetea ?page al cambiar — al filtrar empezamos desde la
 * página 1.
 */
export function SalesStatusSelect({ value }: SalesStatusSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(next: string | null) {
    if (next === null) return;
    const params = new URLSearchParams(searchParams?.toString());
    if (next === "all") params.delete("status");
    else params.set("status", next);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/dashboard/ventas?${qs}` : "/dashboard/ventas");
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-full sm:w-[200px]">
        <SelectValue placeholder="Todos los estados">
          {(v) => STATUS_LABEL_BY_VALUE[v as string] ?? "Todos los estados"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
