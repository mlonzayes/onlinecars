import Link from "next/link";
import { Car } from "lucide-react";

interface BrandsGridProps {
  brands: { name: string; logoUrl: string | null }[];
  basePath: string;
  // Cuántas marcas mostrar máximo (Boxcar muestra 6 en su grid principal).
  limit?: number;
}

export function BrandsGrid({ brands, basePath, limit = 6 }: BrandsGridProps) {
  if (!brands || brands.length === 0) return null;

  const visible = brands.slice(0, limit);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {visible.map((brand) => (
        <Link
          key={brand.name}
          href={`${basePath}/catalogo?brand=${encodeURIComponent(brand.name)}`}
          className="group flex aspect-[3/2] flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[var(--tenant-primary)] hover:shadow-lg hover:ring-1 hover:ring-[var(--tenant-primary)]/20"
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
            <Car className="h-10 w-10 flex-1 text-slate-400 transition-colors group-hover:text-[var(--tenant-primary)]" />
          )}
          <span className="text-xs font-semibold text-slate-600 group-hover:text-[var(--tenant-primary)] sm:text-sm">
            {brand.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
