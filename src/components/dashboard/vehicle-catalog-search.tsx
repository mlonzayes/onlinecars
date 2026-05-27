"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search, Sparkles } from "lucide-react";
import type { FuelType } from "@/lib/constants";

/**
 * Búsqueda con autocomplete del catálogo de vehículos.
 * Pega a GET /api/vehiculos/catalog?q=xxx con debounce 250ms.
 *
 * Cuando el user selecciona un resultado, llama a `onSelect` con los campos
 * que se pueden auto-completar en el form del vehículo. El form decide qué
 * hacer con esos datos (típicamente: setValue() en múltiples campos).
 */

export interface VehicleCatalogResult {
  brand: string;
  model: string;
  version: string | null;
  fuel: FuelType | null;
  engine: string | null;
  fullName: string;
}

interface VehicleCatalogSearchProps {
  // Callback cuando el user selecciona un resultado del autocomplete.
  // Si el caller necesita extender los campos auto-completados a futuro
  // (ej: agregar bodyType al CSV), este es el único punto de cambio.
  onSelect: (result: VehicleCatalogResult) => void;
  // Texto del placeholder del input. Default genérico.
  placeholder?: string;
  // Si el form ya está bloqueado por algún motivo (ej: venta activa).
  disabled?: boolean;
}

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

export function VehicleCatalogSearch({
  onSelect,
  placeholder = "Buscar modelo (ej: Corolla 2.0 XLi)...",
  disabled = false,
}: VehicleCatalogSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VehicleCatalogResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Click fuera del componente cierra el dropdown.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce + fetch. Cancela el request anterior si llega un keystroke nuevo
  // antes de que termine — evita race condition donde la respuesta vieja
  // sobrescribe la nueva.
  useEffect(() => {
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const handle = setTimeout(async () => {
      // Abortar request anterior si seguía en vuelo
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(
          `/api/vehiculos/catalog?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          setResults([]);
          return;
        }
        const data = (await res.json()) as { data: VehicleCatalogResult[] };
        setResults(data.data ?? []);
        setOpen(true);
      } catch (err) {
        // AbortError es esperado cuando un keystroke nuevo cancela el anterior
        if (err instanceof Error && err.name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [query]);

  function handleSelect(result: VehicleCatalogResult) {
    onSelect(result);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--primary)]/40 bg-[var(--primary)]/5 px-3 py-2">
        <Sparkles className="h-4 w-4 shrink-0 text-[var(--primary)]" />
        <div className="relative flex-1">
          <Search className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full bg-transparent pl-6 pr-6 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          {loading && (
            <Loader2 className="absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-md border bg-popover shadow-lg">
          {results.map((r) => (
            <button
              key={r.fullName}
              type="button"
              onClick={() => handleSelect(r)}
              className="flex w-full flex-col gap-0.5 border-b px-3 py-2 text-left last:border-b-0 hover:bg-accent"
            >
              <span className="text-sm font-medium">{r.fullName}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {r.fuel && <span>{labelForFuel(r.fuel)}</span>}
                {r.fuel && r.engine && <span>·</span>}
                {r.engine && <span>{r.engine}</span>}
              </span>
            </button>
          ))}
        </div>
      )}

      {open && !loading && query.trim().length >= MIN_QUERY_LENGTH && results.length === 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-md border bg-popover px-3 py-4 text-center text-sm text-muted-foreground shadow-lg">
          Sin resultados para &ldquo;{query}&rdquo;. Podés cargar el título a mano.
        </div>
      )}
    </div>
  );
}

const FUEL_LABEL: Record<FuelType, string> = {
  nafta: "Nafta",
  diesel: "Diésel",
  electrico: "Eléctrico",
  hibrido: "Híbrido",
  gnc: "GNC",
};

function labelForFuel(f: FuelType): string {
  return FUEL_LABEL[f] ?? f;
}
