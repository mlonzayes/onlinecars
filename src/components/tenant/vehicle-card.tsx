import Image from "next/image";
import Link from "next/link";
import { VehicleBadge, type VehiclePriceTag } from "./vehicle-badge";
import { Car, Cog, Fuel, Gauge, Star } from "lucide-react";
import {
  VEHICLE_BODY_TYPE_LABELS,
  type VehicleBodyType,
} from "@/lib/constants";

// Tipo flexible: acepta tanto vehicles del Prisma client (Decimal price) como
// versiones serializadas (string price). El formatPrice maneja ambos.
export interface VehicleCardData {
  id: string;
  // Slug URL-friendly. La card linkea con este, NO con `id`, para no exponer
  // UUIDs en el sitio público.
  publicSlug: string;
  title: string;
  condition: string;
  featured?: boolean;
  kilometers: number | null;
  fuelType: string | null;
  transmission?: string | null;
  bodyType?: string | null;
  price: unknown;
  currency: string;
  images: { url: string; isPrimary?: boolean; alt?: string | null }[];
  priceTag?: string | null;
  originalPrice?: unknown;
}

const TRANSMISSION_SHORT: Record<string, string> = {
  manual: "Manual",
  automatica: "Auto.",
};

interface VehicleCardProps {
  vehicle: VehicleCardData;
  basePath: string;
  // Si true, NO renderiza el badge "Destacado" aunque el vehículo lo sea.
  // Útil en secciones que ya implican destacados (como el carrusel de featured),
  // donde el badge queda redundante.
  hideFeaturedBadge?: boolean;
}

function formatPrice(price: unknown, currency: string): string {
  const num = typeof price === "string" ? parseFloat(price) : Number(price);
  if (isNaN(num)) return "Consultar";

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatKm(km: number | null): string {
  if (!km) return "0 km";
  return `${km.toLocaleString("es-AR")} km`;
}

export function VehicleCard({ vehicle, basePath, hideFeaturedBadge = false }: VehicleCardProps) {
  const primaryImage = vehicle.images.find((i) => i.isPrimary) ?? vehicle.images[0];

  return (
    <Link
      href={`${basePath}/vehiculo/${vehicle.publicSlug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-[var(--tenant-border)] bg-[var(--tenant-surface)] shadow-sm transition-all duration-200 hover:border-[var(--tenant-primary)]/40 hover:shadow-md sm:hover:-translate-y-0.5"
    >
      {/* Featured Badge — solo si vehicle.featured y el caller no lo oculta */}
      {vehicle.featured && !hideFeaturedBadge && (
        <div className="absolute left-2 top-2 z-10 flex items-center gap-0.5 rounded-full bg-amber-400/95 px-2 py-0.5 text-[10px] font-bold text-amber-950 shadow-sm">
          <Star className="h-2.5 w-2.5 fill-current" />
          Destacado
        </div>
      )}

      {/* Condition Badge */}
      <div className="absolute right-2 top-2 z-10 rounded-full bg-[var(--tenant-surface)]/95 px-2 py-0.5 text-[10px] font-semibold text-[var(--tenant-fg)] shadow-sm">
        {vehicle.condition === "new" ? "0 km" : "Usado"}
      </div>

      {/* Image — aspect-video (16:9) es más slim que 4:3 → cards más bajas */}
      <div className="relative aspect-video overflow-hidden bg-[var(--tenant-surface-hover)]">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt ?? vehicle.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Car className="h-10 w-10 text-[var(--tenant-fg-subtle)]" />
          </div>
        )}
      </div>

      {/* Content — padding más chico en mobile */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        {/* Body type — eyebrow chiquito arriba del título */}
        {vehicle.bodyType && (
          <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--tenant-fg-subtle)] sm:text-[10px]">
            {VEHICLE_BODY_TYPE_LABELS[vehicle.bodyType as VehicleBodyType] ??
              vehicle.bodyType}
          </p>
        )}

        {/* Title — text-sm en mobile, text-base en sm+ */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--tenant-fg)] transition-colors group-hover:text-[var(--tenant-primary)] sm:text-base">
          {vehicle.title}
        </h3>

        {/* Specs — visibles en sm+; en mobile sólo km para no apretar tanto la card */}
        <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-[var(--tenant-fg-muted)] sm:gap-x-3 sm:text-xs">
          {vehicle.kilometers != null && (
            <span className="flex items-center gap-1">
              <Gauge className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {formatKm(vehicle.kilometers)}
            </span>
          )}
          {vehicle.fuelType && (
            <span className="hidden items-center gap-1 sm:flex">
              <Fuel className="h-3.5 w-3.5" />
              {vehicle.fuelType.charAt(0).toUpperCase() + vehicle.fuelType.slice(1)}
            </span>
          )}
          {vehicle.transmission && (
            <span className="hidden items-center gap-1 sm:flex">
              <Cog className="h-3.5 w-3.5" />
              {TRANSMISSION_SHORT[vehicle.transmission] ?? vehicle.transmission}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mt-auto pt-2 flex items-center justify-between gap-1">
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-[var(--tenant-fg)] sm:text-lg">
                {formatPrice(vehicle.price, vehicle.currency)}
              </span>
              <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--tenant-fg-subtle)] sm:text-[10px]">
                {vehicle.currency}
              </span>
            </div>
            {vehicle.originalPrice ? (
              <span className="text-xs text-[var(--tenant-fg-subtle)] line-through sm:text-sm">
                {formatPrice(vehicle.originalPrice, vehicle.currency)}
              </span>
            ) : null}
          </div>
          {vehicle.priceTag && (
            <VehicleBadge tag={vehicle.priceTag as VehiclePriceTag} />
          )}
        </div>
      </div>
    </Link>
  );
}
