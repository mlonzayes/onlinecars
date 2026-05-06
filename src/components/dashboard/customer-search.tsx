"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const DEBOUNCE_MS = 300;

interface CustomerSearchProps {
  placeholder?: string;
}

// Input de búsqueda con debounce. Actualiza ?q= en la URL sin scroll.
// Resetea ?page=1 al buscar — sino quedamos en una página que ya no existe
// con los resultados filtrados.
export function CustomerSearch({
  placeholder = "Buscar por nombre, documento o email...",
}: CustomerSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const initial = searchParams?.get("q") ?? "";
  const [value, setValue] = useState(initial);

  // Si el query param cambia desde afuera (ej: navegación back/forward), sincronizamos.
  useEffect(() => {
    setValue(searchParams?.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const trimmed = value.trim();
    const current = searchParams?.get("q") ?? "";
    if (trimmed === current) return;

    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      // Volvemos a página 1 al cambiar la búsqueda.
      params.delete("page");

      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `?${qs}` : "?", { scroll: false });
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [value, searchParams, router]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
        aria-label="Buscar clientes"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Limpiar búsqueda"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
