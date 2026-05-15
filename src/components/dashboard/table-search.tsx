"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const DEBOUNCE_MS = 300;

interface TableSearchProps {
  placeholder?: string;
  ariaLabel?: string;
}

// Input de búsqueda genérico para listas server-rendered. Actualiza ?q= en la
// URL con debounce y resetea ?page=1 al cambiar la búsqueda. Reusable en
// cualquier listado (Clientes, Vehículos, Leads, Ventas).
//
// type="text" en vez de "search" para evitar la X nativa del browser que se
// superpone con la X custom y crea lag al borrar.
export function TableSearch({
  placeholder = "Buscar...",
  ariaLabel = "Buscar",
}: TableSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Inicializamos desde la URL pero NO re-sincronizamos en cambios posteriores
  // de searchParams: cada keystroke disparaba un render extra cuando router.push
  // actualizaba la URL y eso se sentía como lag al escribir.
  const initial = searchParams?.get("q") ?? "";
  const [value, setValue] = useState(initial);

  function executeSearch(searchTerm: string) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    const trimmed = searchTerm.trim();
    
    // Evitar búsquedas de menos de 3 caracteres (salvo que sea para vaciar)
    if (trimmed.length > 0 && trimmed.length < 3) {
      return;
    }

    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    params.delete("page");

    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `?${qs}` : "?", { scroll: false });
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      executeSearch(value);
    }
  }

  function clearSearch() {
    setValue("");
    executeSearch("");
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder + " (Presioná Enter para buscar)"}
        className="pl-9 pr-9"
        aria-label={ariaLabel}
      />
      {value && (
        <button
          type="button"
          onClick={clearSearch}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Limpiar búsqueda"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
