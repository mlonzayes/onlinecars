import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CatalogPaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  // searchParams sin "page" — los preservamos en los hrefs así el filtro/sort
  // no se pierde al cambiar de página.
  preservedQuery: Record<string, string | undefined>;
}

/**
 * Construye la lista de páginas a mostrar con ellipsis intercalado.
 *
 * Ejemplos (current = página actual):
 *   total=5, current=2  → [1, 2, 3, 4, 5]
 *   total=10, current=1 → [1, 2, 3, "...", 10]
 *   total=10, current=5 → [1, "...", 4, 5, 6, "...", 10]
 *   total=10, current=10 → [1, "...", 8, 9, 10]
 *
 * Siempre mostramos primera y última. Una "ventana" de ±1 alrededor de current.
 * Si no hay gap, no metemos ellipsis.
 */
function buildPaginationItems(
  current: number,
  total: number
): Array<number | "ellipsis"> {
  // ≤7 páginas: las mostramos todas, sin ellipsis.
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const items: Array<number | "ellipsis"> = [1];

  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  if (left > 2) items.push("ellipsis");
  for (let i = left; i <= right; i++) items.push(i);
  if (right < total - 1) items.push("ellipsis");

  items.push(total);
  return items;
}

/**
 * Construye el href para una página dada preservando los otros searchParams
 * (filtros, sort, etc). Page 1 va sin el `?page=1` para que la URL canónica
 * sea limpia.
 */
function buildHref(
  basePath: string,
  preservedQuery: Record<string, string | undefined>,
  page: number
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(preservedQuery)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `${basePath}/catalogo${qs ? `?${qs}` : ""}`;
}

export function CatalogPagination({
  currentPage,
  totalPages,
  basePath,
  preservedQuery,
}: CatalogPaginationProps) {
  // No mostramos paginación si hay 1 sola página — el control ocupa lugar
  // sin aportar nada.
  if (totalPages <= 1) return null;

  const items = buildPaginationItems(currentPage, totalPages);
  const prevPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const itemBaseClass =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-sm font-medium transition-colors sm:h-9 sm:min-w-9 sm:px-2.5";

  return (
    <nav
      role="navigation"
      aria-label="Paginación del catálogo"
      className="mt-6 flex items-center justify-center gap-1 sm:mt-8 sm:gap-1.5"
    >
      {/* Anterior */}
      {hasPrev ? (
        <Link
          href={buildHref(basePath, preservedQuery, prevPage)}
          aria-label="Página anterior"
          className={`${itemBaseClass} border-[var(--tenant-border-strong)] bg-[var(--tenant-surface)] text-[var(--tenant-fg)] hover:border-[var(--tenant-primary)] hover:text-[var(--tenant-primary)]`}
          rel="prev"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span
          aria-hidden="true"
          className={`${itemBaseClass} cursor-not-allowed border-[var(--tenant-border)] bg-[var(--tenant-surface-hover)] text-[var(--tenant-fg-subtle)]`}
        >
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {items.map((item, idx) => {
        if (item === "ellipsis") {
          return (
            <span
              key={`ellipsis-${idx}`}
              aria-hidden="true"
              className="px-1 text-sm text-[var(--tenant-fg-subtle)] sm:px-1.5"
            >
              …
            </span>
          );
        }
        const isCurrent = item === currentPage;
        if (isCurrent) {
          return (
            <span
              key={item}
              aria-current="page"
              className={`${itemBaseClass} border-[var(--tenant-primary)] bg-[var(--tenant-primary)] text-white`}
            >
              {item}
            </span>
          );
        }
        return (
          <Link
            key={item}
            href={buildHref(basePath, preservedQuery, item)}
            aria-label={`Ir a la página ${item}`}
            className={`${itemBaseClass} border-[var(--tenant-border-strong)] bg-[var(--tenant-surface)] text-[var(--tenant-fg)] hover:border-[var(--tenant-primary)] hover:text-[var(--tenant-primary)]`}
          >
            {item}
          </Link>
        );
      })}

      {/* Siguiente */}
      {hasNext ? (
        <Link
          href={buildHref(basePath, preservedQuery, nextPage)}
          aria-label="Página siguiente"
          className={`${itemBaseClass} border-[var(--tenant-border-strong)] bg-[var(--tenant-surface)] text-[var(--tenant-fg)] hover:border-[var(--tenant-primary)] hover:text-[var(--tenant-primary)]`}
          rel="next"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span
          aria-hidden="true"
          className={`${itemBaseClass} cursor-not-allowed border-[var(--tenant-border)] bg-[var(--tenant-surface-hover)] text-[var(--tenant-fg-subtle)]`}
        >
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
