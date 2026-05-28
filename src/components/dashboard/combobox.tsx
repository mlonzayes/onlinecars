"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ComboboxProps<T extends { id: string }> {
  id: string;
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  options: T[];
  value: string;
  onSelect: (id: string) => void;
  renderOption: (item: T) => React.ReactNode;
  renderSelected: (item: T) => React.ReactNode;
  loading: boolean;
  onSearch: (query: string) => void;
  required?: boolean;
  emptyMessage?: string;
}

/**
 * Combobox genérico con búsqueda async. Lo extraímos de sale-form.tsx para
 * reusar en quotation-sale-form y demás listados con búsqueda controlada por
 * el padre (fetch al API con limit cada vez que cambia el query).
 *
 * El padre maneja:
 *   - options: lista actual a mostrar (puede limitarse a N items en el server)
 *   - loading: spinner mientras se hace el fetch
 *   - onSearch(query): se dispara con cada keystroke; el padre decide debounce
 *
 * Usar `renderSelected` para mostrar el item activo en el trigger (sin
 * dropdown abierto) y `renderOption` para cada opción del menú.
 */
export function Combobox<T extends { id: string }>({
  id,
  label,
  placeholder,
  searchPlaceholder,
  options,
  value,
  onSelect,
  renderOption,
  renderSelected,
  loading,
  onSearch,
  required,
  emptyMessage = "No se encontraron resultados",
}: ComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(q: string) {
    setQuery(q);
    onSearch(q);
  }

  function handleSelect(itemId: string) {
    onSelect(itemId);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="space-y-1.5" ref={ref}>
      <Label htmlFor={id}>
        {label}
        {required && " *"}
      </Label>
      <div className="relative">
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-required={required}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            !selected && "text-muted-foreground"
          )}
        >
          <span className="truncate">
            {selected ? renderSelected(selected) : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>

        {open && (
          <div id={`${id}-listbox`} className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
            <div className="p-2">
              <Input
                autoFocus
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : options.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </p>
              ) : (
                options.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        value === item.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{renderOption(item)}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
