import Link from "next/link";
import { Car, Truck } from "lucide-react";
import {
  VEHICLE_BODY_TYPES,
  VEHICLE_BODY_TYPE_LABELS,
  type VehicleBodyType,
} from "@/lib/constants";

interface CategoriesGridProps {
  basePath: string;
}

// Mapeo de body type a ícono lucide. Lucide no tiene íconos específicos por carrocería,
// así que usamos Car como genérico y Truck para variantes utilitarias. En Fase 5 (polish)
// se pueden reemplazar por SVGs custom o ilustraciones.
const CATEGORY_ICONS: Record<VehicleBodyType, React.ComponentType<{ className?: string }>> = {
  suv: Car,
  sedan: Car,
  hatchback: Car,
  coupe: Car,
  pickup: Truck,
  minivan: Truck,
  convertible: Car,
};

export function CategoriesGrid({ basePath }: CategoriesGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-7">
      {VEHICLE_BODY_TYPES.map((type) => {
        const Icon = CATEGORY_ICONS[type];
        return (
          <Link
            key={type}
            href={`${basePath}/catalogo?bodyType=${type}`}
            className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-[var(--tenant-border)] bg-[var(--tenant-surface)] p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--tenant-primary)] hover:shadow-lg hover:ring-1 hover:ring-[var(--tenant-primary)]/20"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--tenant-surface-hover)] text-[var(--tenant-fg-muted)] transition-colors group-hover:bg-[var(--tenant-primary)] group-hover:text-white">
              <Icon className="h-6 w-6" />
            </div>
            <span className="text-sm font-semibold text-[var(--tenant-fg)] group-hover:text-[var(--tenant-primary)]">
              {VEHICLE_BODY_TYPE_LABELS[type]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
