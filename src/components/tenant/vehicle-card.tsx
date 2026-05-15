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

export function VehicleCard({ vehicle, basePath }: VehicleCardProps) {
  const primaryImage = vehicle.images.find((i) => i.isPrimary) ?? vehicle.images[0];

  return (
    <Link
      href={`${basePath}/vehiculo/${vehicle.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Featured Badge */}
      {vehicle.featured && (
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-amber-400/90 px-2.5 py-1 text-xs font-bold text-amber-950 shadow-md backdrop-blur-sm">
          <Star className="h-3 w-3 fill-current" />
          Destacado
        </div>
      )}

      {/* Condition Badge */}
      <div className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur-sm">
        {vehicle.condition === "new" ? "0 km" : "Usado"}
      </div>

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt ?? vehicle.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Car className="h-16 w-16 text-gray-300" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Body type — eyebrow chiquito arriba del título */}
        {vehicle.bodyType && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {VEHICLE_BODY_TYPE_LABELS[vehicle.bodyType as VehicleBodyType] ??
              vehicle.bodyType}
          </p>
        )}

        {/* Title — el dealer ya suele incluir marca/modelo/año en el title */}
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-gray-900 transition-colors group-hover:text-[var(--tenant-primary)]">
          {vehicle.title}
        </h3>

        {/* Specs */}
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
          {vehicle.kilometers != null && (
            <span className="flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" />
              {formatKm(vehicle.kilometers)}
            </span>
          )}
          {vehicle.fuelType && (
            <span className="flex items-center gap-1">
              <Fuel className="h-3.5 w-3.5" />
              {vehicle.fuelType.charAt(0).toUpperCase() + vehicle.fuelType.slice(1)}
            </span>
          )}
          {vehicle.transmission && (
            <span className="flex items-center gap-1">
              <Cog className="h-3.5 w-3.5" />
              {TRANSMISSION_SHORT[vehicle.transmission] ?? vehicle.transmission}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-gray-900">
                {formatPrice(vehicle.price, vehicle.currency)}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                {vehicle.currency}
              </span>
            </div>
            {vehicle.originalPrice ? (
              <span className="text-sm text-slate-400 line-through mt-0.5">
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
