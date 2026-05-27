"use client";

import { useMemo, useState } from "react";
import { Car, Check, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GLOBAL_BRANDS from "@/data/brands.json";

interface BrandsSettingsProps {
  // Componente controlado: el estado de selección vive en el padre. Esto permite
  // que el botón "Guardar" del padre (ej: SectionEditorSheet) haga UN solo save
  // que incluya tanto la metadata de la sección como las marcas — evitando los
  // dos botones de guardar que confundían al user.
  selectedBrandIds: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Panel de selección de marcas oficiales. Layout compacto pensado para vivir
 * dentro del sheet del editor de sección (ancho ~max-w-xl).
 *
 * UX:
 *   - Search prominente arriba
 *   - "Seleccionadas" en card destacado arriba (las marcas que el dealer ya eligió)
 *   - "Disponibles" abajo, scrolleable. Click en una row → toggle
 *   - Botones de bulk: limpiar todo, seleccionar visibles (las que matchean el search)
 *
 * NO tiene botón propio de "Guardar" — el componente es controlado, el padre
 * decide cuándo persistir. Esto fue una decisión consciente para evitar
 * tener dos botones de guardar en el mismo sheet.
 */
export function BrandsSettings({ selectedBrandIds, onChange }: BrandsSettingsProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const matchesSearch = (name: string) =>
    !normalizedSearch || name.toLowerCase().includes(normalizedSearch);

  // Particionamos las marcas en seleccionadas vs disponibles, aplicando search a ambas.
  const { selected, available } = useMemo(() => {
    const selectedSet = new Set(selectedBrandIds);
    const sel: typeof GLOBAL_BRANDS = [];
    const avl: typeof GLOBAL_BRANDS = [];
    for (const b of GLOBAL_BRANDS) {
      if (!matchesSearch(b.name)) continue;
      if (selectedSet.has(b.id)) sel.push(b);
      else avl.push(b);
    }
    return { selected: sel, available: avl };
    // matchesSearch depende de normalizedSearch, no es estable — recomputamos al cambiar search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBrandIds, normalizedSearch]);

  function toggleBrand(id: string) {
    onChange(
      selectedBrandIds.includes(id)
        ? selectedBrandIds.filter((bId) => bId !== id)
        : [...selectedBrandIds, id]
    );
  }

  function handleSelectVisible() {
    const visibleIds = GLOBAL_BRANDS.filter((b) => matchesSearch(b.name)).map((b) => b.id);
    onChange(Array.from(new Set([...selectedBrandIds, ...visibleIds])));
  }

  function handleClearAll() {
    onChange([]);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">Marcas Oficiales</h3>
        <p className="text-xs text-muted-foreground">
          Seleccioná las marcas que representás. Aparecen con prioridad en el carrusel del sitio público.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar marca..."
          className="pl-8 pr-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Bulk actions: solo aparecen si hay search activo o ya hay seleccionadas */}
      {(normalizedSearch || selectedBrandIds.length > 0) && (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">
            {selectedBrandIds.length > 0 ? `${selectedBrandIds.length} seleccionada${selectedBrandIds.length === 1 ? "" : "s"}` : "Ninguna seleccionada"}
          </span>
          <div className="flex items-center gap-2">
            {normalizedSearch && available.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleSelectVisible}>
                Marcar visibles ({available.length})
              </Button>
            )}
            {selectedBrandIds.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearAll}>
                Limpiar
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Seleccionadas (siempre visibles si hay alguna) */}
      {selected.length > 0 && (
        <div className="rounded-lg border bg-muted/30">
          <div className="border-b px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Seleccionadas
          </div>
          <ul className="divide-y">
            {selected.map((brand) => (
              <BrandRow
                key={brand.id}
                brand={brand}
                selected
                onToggle={() => toggleBrand(brand.id)}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Disponibles (scrolleable) */}
      <div className="rounded-lg border">
        <div className="flex items-center justify-between border-b px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Disponibles</span>
          <span className="font-normal normal-case tracking-normal text-muted-foreground/70">
            {available.length} de {GLOBAL_BRANDS.length}
          </span>
        </div>
        {available.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">
            {normalizedSearch
              ? `No hay coincidencias para "${searchTerm}".`
              : "Ya seleccionaste todas las marcas disponibles."}
          </p>
        ) : (
          <ul className="max-h-72 divide-y overflow-y-auto">
            {available.map((brand) => (
              <BrandRow
                key={brand.id}
                brand={brand}
                selected={false}
                onToggle={() => toggleBrand(brand.id)}
              />
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}

interface BrandRowProps {
  brand: { id: string; name: string; logoUrl: string | null };
  selected: boolean;
  onToggle: () => void;
}

function BrandRow({ brand, selected, onToggle }: BrandRowProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent ${
          selected ? "bg-primary/5" : ""
        }`}
      >
        {/* Check indicator — solo visible si seleccionada, ocupa el mismo espacio igual */}
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
            selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
          }`}
        >
          {selected && <Check className="h-3.5 w-3.5" />}
        </span>

        {/* Logo en cuadrado fijo, fallback a ícono Car. */}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted/50">
          {brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.logoUrl}
              alt={brand.name}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <Car className="h-4 w-4 text-muted-foreground" />
          )}
        </span>

        <span className={`text-sm ${selected ? "font-medium text-foreground" : "text-foreground/80"}`}>
          {brand.name}
        </span>
      </button>
    </li>
  );
}
