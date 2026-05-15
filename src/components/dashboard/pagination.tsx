"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

// Paginador genérico que conserva los demás query params (ej: ?q=...).
// Pensado para listas server-rendered: el cambio de página actualiza la URL
// y la page Server Component re-renderiza con los datos de esa página.
export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) {
    return (
      <p className="text-xs text-muted-foreground">
        {totalItems} {totalItems === 1 ? "resultado" : "resultados"}
      </p>
    );
  }

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?", { scroll: false });
  }

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs text-muted-foreground">
        Mostrando {from}-{to} de {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">
          Página {currentPage} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
