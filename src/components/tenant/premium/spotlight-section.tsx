import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ParallaxMedia } from "./parallax-media";
import { ClipReveal } from "./clip-reveal";
import {
  capitalize,
  formatVehicleKm,
  formatVehiclePrice,
} from "@/lib/tenant-format";
import { VEHICLE_BODY_TYPE_LABELS, type VehicleBodyType } from "@/lib/constants";
import type { TenantHomeBundleVehicle } from "@/lib/tenant";

interface SpotlightSectionProps {
  vehicle: TenantHomeBundleVehicle;
  basePath: string;
  eyebrow?: string;
}

interface SpotlightSpec {
  label: string;
  value: string;
}

function buildSpecs(vehicle: TenantHomeBundleVehicle): SpotlightSpec[] {
  const specs: SpotlightSpec[] = [
    { label: "Año", value: String(vehicle.year) },
    { label: "Kilómetros", value: formatVehicleKm(vehicle.kilometers) },
  ];

  if (vehicle.transmission) {
    specs.push({ label: "Transmisión", value: capitalize(vehicle.transmission) });
  }
  if (vehicle.fuelType) {
    specs.push({ label: "Combustible", value: capitalize(vehicle.fuelType) });
  }
  if (vehicle.bodyType) {
    specs.push({
      label: "Carrocería",
      value:
        VEHICLE_BODY_TYPE_LABELS[vehicle.bodyType as VehicleBodyType] ??
        capitalize(vehicle.bodyType),
    });
  }

  // Cuatro entra prolijo en la grilla de 2x2 (mobile) y en una fila (desktop).
  // Con cinco queda una columna huérfana.
  return specs.slice(0, 4);
}

/**
 * Un solo vehículo ocupando el ancho completo, formato "portada de revista".
 *
 * Es el bloque que rompe la grilla: el resto del home muestra 4 autos por fila,
 * acá hay UNO con la foto a sangre y las specs desplegadas. Esa asimetría es
 * literalmente lo que comunica exclusividad — un auto premium en una card de
 * 300px al lado de otros once no se lee premium, se lee como inventario.
 *
 * Se auto-oculta si el vehículo no tiene foto: un spotlight con placeholder es
 * peor que no tener spotlight.
 */
export function SpotlightSection({
  vehicle,
  basePath,
  eyebrow = "Pieza destacada",
}: SpotlightSectionProps) {
  const image = vehicle.images.find((i) => i.isPrimary) ?? vehicle.images[0];
  if (!image) return null;

  const specs = buildSpecs(vehicle);

  return (
    <section className="relative isolate bg-[var(--tenant-bg)]">
      <ParallaxMedia
        src={image.url}
        alt={image.alt ?? vehicle.title}
        sizes="100vw"
        className="h-[75vh] min-h-[520px] w-full lg:h-[88vh]"
      />

      {/* Doble degradé: uno vertical fuerte abajo (para el texto) y uno lateral
          suave (para que el bloque no corte seco contra el borde izquierdo).
          pointer-events-none para no comerse el hover del CTA. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--tenant-bg)] via-[var(--tenant-bg)]/70 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[var(--tenant-bg)]/80 via-transparent to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8 lg:pb-20">
          <ClipReveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--tenant-primary)]">
              {eyebrow}
            </p>

            <h2
              data-display="xl"
              className="mt-3 max-w-4xl text-[var(--tenant-fg)]"
            >
              {vehicle.title}
            </h2>

            <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              {/* Specs con divisores hairline. En mobile va 2x2; la fila única
                  de 4 columnas aprieta demasiado los valores largos. */}
              <dl className="grid max-w-2xl grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="border-t border-[var(--tenant-border-strong)] pt-3"
                  >
                    <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--tenant-fg-subtle)]">
                      {spec.label}
                    </dt>
                    <dd
                      data-numeric
                      className="mt-1.5 text-base font-medium text-[var(--tenant-fg)]"
                    >
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="flex flex-col gap-4 lg:items-end">
                <div className="flex items-baseline gap-2">
                  <span
                    data-numeric
                    className="text-3xl font-bold text-[var(--tenant-fg)] lg:text-4xl"
                  >
                    {formatVehiclePrice(vehicle.price, vehicle.currency)}
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--tenant-fg-subtle)]">
                    {vehicle.currency}
                  </span>
                </div>

                <Link
                  href={`${basePath}/vehiculo/${vehicle.publicSlug}`}
                  className="group inline-flex w-fit items-center gap-2 border border-[var(--tenant-fg)] px-6 py-3 text-sm font-medium text-[var(--tenant-fg)] transition-colors hover:bg-[var(--tenant-fg)] hover:text-[var(--tenant-bg)]"
                >
                  Ver ficha completa
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </ClipReveal>
        </div>
      </div>
    </section>
  );
}
