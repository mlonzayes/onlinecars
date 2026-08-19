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

interface StickySpecsSectionProps {
  vehicle: TenantHomeBundleVehicle;
  basePath: string;
  eyebrow?: string;
}

function buildRows(vehicle: TenantHomeBundleVehicle): { label: string; value: string }[] {
  const rows = [
    { label: "Marca", value: vehicle.brand },
    { label: "Modelo", value: vehicle.model },
    { label: "Año", value: String(vehicle.year) },
    { label: "Kilómetros", value: formatVehicleKm(vehicle.kilometers) },
    { label: "Condición", value: vehicle.condition === "new" ? "0 km" : "Usado" },
  ];

  if (vehicle.transmission) {
    rows.push({ label: "Transmisión", value: capitalize(vehicle.transmission) });
  }
  if (vehicle.fuelType) {
    rows.push({ label: "Combustible", value: capitalize(vehicle.fuelType) });
  }
  if (vehicle.bodyType) {
    rows.push({
      label: "Carrocería",
      value:
        VEHICLE_BODY_TYPE_LABELS[vehicle.bodyType as VehicleBodyType] ??
        capitalize(vehicle.bodyType),
    });
  }

  return rows;
}

/**
 * Ficha desplegada: la foto queda fija mientras las especificaciones scrollean
 * al lado. Es el tercer formato del home (después de la tira y del bloque a
 * sangre), y el único donde el usuario lee datos duros con calma.
 *
 * Nota de implementación: el "pin" es `position: sticky` nativo, NO
 * ScrollTrigger.pin. pin() envuelve el elemento en un wrapper y agrega un
 * spacer calculado en px, que hay que recalcular en cada resize y se pelea con
 * los breakpoints; sticky hace lo mismo en el compositor, gratis y sin JS.
 * GSAP queda para lo que sí necesita JS: el reveal escalonado y el parallax.
 *
 * El sticky solo se activa en lg+ (`lg:sticky`): en mobile las dos columnas se
 * apilan y fijar la imagen dejaría media pantalla muerta.
 */
export function StickySpecsSection({
  vehicle,
  basePath,
  eyebrow = "Ficha técnica",
}: StickySpecsSectionProps) {
  const image = vehicle.images.find((i) => i.isPrimary) ?? vehicle.images[0];
  if (!image) return null;

  const rows = buildRows(vehicle);

  return (
    <section className="bg-[var(--tenant-bg)] py-16 sm:py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        {/* Columna imagen — top-24 la despega del header flotante del tenant. */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ParallaxMedia
            src={image.url}
            alt={image.alt ?? vehicle.title}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="aspect-[4/3] w-full rounded-[var(--tenant-radius)] lg:aspect-[3/4]"
          />
        </div>

        {/* Columna specs */}
        <div>
          <ClipReveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--tenant-primary)]">
              {eyebrow}
            </p>
            <h2 className="mt-3 text-[var(--tenant-fg)]">{vehicle.title}</h2>
          </ClipReveal>

          <dl className="mt-10">
            {rows.map((row, index) => (
              // El delay escalonado arma la cascada. Cada fila trae su propio
              // ScrollTrigger, así que las que quedan abajo del fold esperan a
              // entrar en viewport en vez de animarse contra una pantalla vacía.
              <ClipReveal key={row.label} delay={index * 0.06}>
                <div className="flex items-baseline justify-between gap-6 border-b border-[var(--tenant-border)] py-4">
                  <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--tenant-fg-subtle)]">
                    {row.label}
                  </dt>
                  <dd
                    data-numeric
                    className="text-right text-base font-medium text-[var(--tenant-fg)] sm:text-lg"
                  >
                    {row.value}
                  </dd>
                </div>
              </ClipReveal>
            ))}
          </dl>

          <ClipReveal delay={rows.length * 0.06}>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-baseline gap-2">
                <span
                  data-numeric
                  className="text-3xl font-bold text-[var(--tenant-fg)]"
                >
                  {formatVehiclePrice(vehicle.price, vehicle.currency)}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--tenant-fg-subtle)]">
                  {vehicle.currency}
                </span>
              </div>

              <Link
                href={`${basePath}/vehiculo/${vehicle.publicSlug}`}
                className="group inline-flex items-center gap-2 bg-[var(--tenant-primary)] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Consultar
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </ClipReveal>
        </div>
      </div>
    </section>
  );
}
