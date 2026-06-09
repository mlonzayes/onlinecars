import Link from "next/link";
import { Car } from "lucide-react";

interface BrandsGridProps {
  brands: { name: string; logoUrl: string | null }[];
  basePath: string;
  // Cuántas marcas mostrar máximo. Default alto (30) porque el carrusel
  // maneja el overflow horizontalmente — no hay razón visual para cortar
  // si el dealer marcó muchas. Si llegan a haber más de 30, el caller
  // explícitamente baja el limit.
  limit?: number;
}

// Si hay <= este número de marcas, las mostramos centradas (sin scroll).
// Por encima, pasamos a layout de carrusel horizontal.
const CAROUSEL_THRESHOLD = 6;

export function BrandsGrid({ brands, basePath, limit = 30 }: BrandsGridProps) {
  if (!brands || brands.length === 0) return null;

  const visible = brands.slice(0, limit);
  const useCarousel = visible.length > CAROUSEL_THRESHOLD;

  // Layout carousel: scroll horizontal, scrollbar oculto, snap suave.
  // Layout grid: flex con justify-center + wrap → centra la fila aunque sean impares.
  if (useCarousel) {
    return (
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visible.map((brand) => (
          <div key={brand.name} className="w-[160px] shrink-0 snap-start">
            <BrandCard brand={brand} basePath={basePath} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-stretch justify-center gap-4">
      {visible.map((brand) => (
        <div key={brand.name} className="w-[160px]">
          <BrandCard brand={brand} basePath={basePath} />
        </div>
      ))}
    </div>
  );
}

interface BrandCardProps {
  brand: { name: string; logoUrl: string | null };
  basePath: string;
}

function BrandCard({ brand, basePath }: BrandCardProps) {
  return (
    <Link
      href={`${basePath}/catalogo?brand=${encodeURIComponent(brand.name)}`}
      className="group flex aspect-[3/2] flex-col items-center justify-center gap-2 rounded-xl border border-[var(--tenant-border)] bg-[var(--tenant-surface)] p-4 transition-all hover:-translate-y-0.5 hover:border-[var(--tenant-primary)] hover:shadow-lg hover:ring-1 hover:ring-[var(--tenant-primary)]/20"
    >
      {brand.logoUrl ? (
        <div className="flex h-10 flex-1 items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={brand.logoUrl}
            alt={`Logo ${brand.name}`}
            className="max-h-full max-w-[80%] object-contain transition-all"
          />
        </div>
      ) : (
        <Car className="h-10 w-10 flex-1 text-[var(--tenant-fg-subtle)] transition-colors group-hover:text-[var(--tenant-primary)]" />
      )}
      <span className="text-xs font-semibold text-[var(--tenant-fg-muted)] group-hover:text-[var(--tenant-primary)] sm:text-sm">
        {brand.name}
      </span>
    </Link>
  );
}
