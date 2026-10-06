import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VehicleCard, type VehicleCardData } from "./vehicle-card";
import { CarouselScroller } from "./carousel-scroller";

interface FeaturedTabsProps {
  vehicles: VehicleCardData[];
  basePath: string;
  // Cantidad máxima de vehículos a mostrar.
  limit?: number;
  // Intervalo de auto-advance en ms. Default 4000ms (4s). 0 = desactivado.
  autoAdvanceMs?: number;
}

/**
 * Carrusel horizontal de vehículos (destacados y colecciones del home).
 *
 * Server Component: las cards se renderizan acá y viajan como HTML. Lo
 * interactivo (botones, autoplay, fade-up) vive en <CarouselScroller>. Antes
 * todo el carrusel era cliente, y con 4 carruseles en el home eran ~30 cards
 * metidas en el bundle de JS.
 *
 * Mantiene el nombre FeaturedTabs para no romper imports.
 */
export function FeaturedTabs({
  vehicles,
  basePath,
  // 6 y no 8: con 4 carruseles en el home eran 30+ cards (~1.700 nodos de DOM
  // para hidratar). El resto del stock queda a un clic en "Ver todo".
  limit = 6,
  autoAdvanceMs = 4000,
}: FeaturedTabsProps) {
  const visible = vehicles.slice(0, limit);

  if (visible.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--tenant-border-strong)] bg-[var(--tenant-surface)] py-12 text-center text-sm text-[var(--tenant-fg-muted)]">
        Sin vehículos destacados todavía.
      </p>
    );
  }

  return (
    <CarouselScroller
      itemCount={visible.length}
      autoAdvanceMs={autoAdvanceMs}
      trailing={
        <Link
          href={`${basePath}/catalogo`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--tenant-primary-text)] hover:underline"
        >
          Ver todo
          <ArrowRight className="h-4 w-4" />
        </Link>
      }
    >
      {visible.map((vehicle) => (
        <div key={vehicle.id} className="w-[280px] shrink-0 snap-start sm:w-[300px]">
          <VehicleCard vehicle={vehicle} basePath={basePath} hideFeaturedBadge />
        </div>
      ))}
    </CarouselScroller>
  );
}
