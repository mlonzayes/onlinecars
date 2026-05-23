"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPE_OPTIONS = [
  { value: "all", label: "Todos los tipos" },
  { value: "sale", label: "Venta" },
  { value: "purchase", label: "Compra" },
] as const;

const STATUS_OPTIONS = [
  { value: "all", label: "Todos los estados" },
  { value: "pending", label: "Pendientes" },
  { value: "accepted", label: "Aceptadas" },
  { value: "rejected", label: "Rechazadas" },
  { value: "expired", label: "Vencidas" },
] as const;

const TYPE_LABEL_BY_VALUE: Record<string, string> = Object.fromEntries(
  TYPE_OPTIONS.map((o) => [o.value, o.label])
);
const STATUS_LABEL_BY_VALUE: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label])
);

interface QuotationsFiltersProps {
  type: string;
  status: string;
}

/**
 * Dos selects URL-based: tipo (venta/compra) y estado. Sincronizan con los
 * params `?type=` y `?status=` para que el server pueda filtrar en SQL y la
 * URL sea bookmarkable. Resetean `?page` al cambiar — un filtro nuevo arranca
 * desde la página 1.
 *
 * Base UI no replica el children del Item en el Value automáticamente como
 * Radix; usamos render fn en el SelectValue para mostrar labels en lugar de
 * values crudos ("all", "pending", etc).
 */
export function QuotationsFilters({ type, status }: QuotationsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(updates: { type?: string; status?: string }) {
    const params = new URLSearchParams(searchParams?.toString());
    if (updates.type !== undefined) {
      if (updates.type === "all") params.delete("type");
      else params.set("type", updates.type);
    }
    if (updates.status !== undefined) {
      if (updates.status === "all") params.delete("status");
      else params.set("status", updates.status);
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/dashboard/cotizaciones?${qs}` : "/dashboard/cotizaciones");
  }

  return (
    <div className="flex gap-2">
      <Select
        value={type}
        onValueChange={(v) => v !== null && navigate({ type: v })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Todos los tipos">
            {(v) => TYPE_LABEL_BY_VALUE[v as string] ?? "Todos los tipos"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {TYPE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={status}
        onValueChange={(v) => v !== null && navigate({ status: v })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Todos los estados">
            {(v) => STATUS_LABEL_BY_VALUE[v as string] ?? "Todos los estados"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
