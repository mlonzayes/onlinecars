import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Calendar,
  Car,
  Fuel,
  Gauge,
  Palette,
  DoorOpen,
  Cog,
  MessageCircle,
  Star,
} from "lucide-react";
import {
  getDealershipBySlug,
  getPublishedVehicleBySlug,
  getTenantBasePath,
  getTenantPublicUrl,
} from "@/lib/tenant";
import { VehicleGallery } from "@/components/tenant/vehicle-gallery";
import { TenantContactForm } from "@/components/tenant/contact-form";
import { JsonLd } from "@/components/seo/json-ld";
import { ShareButton } from "@/components/tenant/share-button";
import { MetaTrackEvent } from "@/components/meta/meta-track-event";

interface VehicleDetailPageProps {
  params: Promise<{ slug: string; publicSlug: string }>;
}

export async function generateMetadata({ params }: VehicleDetailPageProps): Promise<Metadata> {
  const { slug, publicSlug } = await params;
  const dealership = await getDealershipBySlug(slug);
  if (!dealership) return { title: "No encontrado" };

  const vehicle = await getPublishedVehicleBySlug(dealership.id, publicSlug);
  if (!vehicle) return { title: "Vehículo no encontrado" };

  const price = formatPrice(vehicle.price, vehicle.currency);
  const title = `${vehicle.title} — ${price} | ${dealership.name}`;
  const description = vehicle.description
    ? vehicle.description.slice(0, 160)
    : `${vehicle.brand} ${vehicle.model} ${vehicle.year} - ${price}. Disponible en ${dealership.name}.`;

  // Canonical propio: el layout del tenant declara el de la home y sin este
  // override CADA ficha de vehículo le diría a Google que es una copia de ella.
  // En un catálogo de 80 autos, eso es el catálogo entero fuera del índice.
  const canonical = `${getTenantPublicUrl(dealership)}/vehiculo/${vehicle.publicSlug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      images: vehicle.images[0]?.url ? [vehicle.images[0].url] : [],
    },
  };
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

const FUEL_LABELS: Record<string, string> = {
  nafta: "Nafta",
  diesel: "Diésel",
  gnc: "GNC",
  electrico: "Eléctrico",
  hibrido: "Híbrido",
};

const TRANSMISSION_LABELS: Record<string, string> = {
  manual: "Manual",
  automatica: "Automática",
};

export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const { slug, publicSlug } = await params;
  const dealership = await getDealershipBySlug(slug);
  if (!dealership) notFound();

  const vehicle = await getPublishedVehicleBySlug(dealership.id, publicSlug);
  if (!vehicle) notFound();

  const basePath = await getTenantBasePath(slug);

  // Structured data Car + Offer: precio, año, km, condición. Es lo que hace que
  // Google/IA puedan listar y entender este vehículo en particular.
  const publicUrl = getTenantPublicUrl(dealership);
  const vehicleUrl = `${publicUrl}/vehiculo/${vehicle.publicSlug}`;
  const carLd = {
    "@type": "Car",
    name: vehicle.title,
    url: vehicleUrl,
    brand: { "@type": "Brand", name: vehicle.brand },
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
    itemCondition:
      vehicle.condition === "new"
        ? "https://schema.org/NewCondition"
        : "https://schema.org/UsedCondition",
    ...(vehicle.images.length > 0 ? { image: vehicle.images.map((i) => i.url) } : {}),
    ...(vehicle.description ? { description: vehicle.description } : {}),
    ...(vehicle.color ? { color: vehicle.color } : {}),
    ...(vehicle.kilometers != null
      ? {
          mileageFromOdometer: {
            "@type": "QuantitativeValue",
            value: vehicle.kilometers,
            unitCode: "KMT",
          },
        }
      : {}),
    ...(vehicle.fuelType
      ? { fuelType: FUEL_LABELS[vehicle.fuelType] ?? vehicle.fuelType }
      : {}),
    ...(vehicle.transmission
      ? {
          vehicleTransmission:
            TRANSMISSION_LABELS[vehicle.transmission] ?? vehicle.transmission,
        }
      : {}),
    ...(vehicle.vin ? { vehicleIdentificationNumber: vehicle.vin } : {}),
    offers: {
      "@type": "Offer",
      price: vehicle.price.toString(),
      priceCurrency: vehicle.currency,
      availability: "https://schema.org/InStock",
      url: vehicleUrl,
      seller: { "@type": "AutoDealer", name: dealership.name },
    },
  };

  // BreadcrumbList: Google muestra "concesionaria.com › Catálogo › Auto" en vez
  // de la URL cruda. Las migas coinciden con la navegación real de la ficha.
  const breadcrumbLd = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: publicUrl },
      { "@type": "ListItem", position: 2, name: "Catálogo", item: `${publicUrl}/catalogo` },
      { "@type": "ListItem", position: 3, name: vehicle.title, item: vehicleUrl },
    ],
  };

  // Un solo <script> con @graph: los nodos quedan vinculados como una misma
  // página en vez de competir entre sí.
  const pageLd = {
    "@context": "https://schema.org",
    "@graph": [carLd, breadcrumbLd],
  };

  const whatsappMessage = encodeURIComponent(
    `Hola! Me interesa el ${vehicle.title} (${formatPrice(vehicle.price, vehicle.currency)}). ¿Está disponible?`
  );
  const whatsappUrl = dealership.whatsapp
    ? `https://wa.me/${dealership.whatsapp.replace(/\D/g, "")}?text=${whatsappMessage}`
    : null;

  const specs = [
    { icon: Calendar, label: "Año", value: vehicle.year.toString() },
    vehicle.kilometers != null
      ? { icon: Gauge, label: "Kilómetros", value: formatKm(vehicle.kilometers) }
      : null,
    vehicle.fuelType
      ? { icon: Fuel, label: "Combustible", value: FUEL_LABELS[vehicle.fuelType] ?? vehicle.fuelType }
      : null,
    vehicle.transmission
      ? { icon: Cog, label: "Transmisión", value: TRANSMISSION_LABELS[vehicle.transmission] ?? vehicle.transmission }
      : null,
    vehicle.color
      ? { icon: Palette, label: "Color", value: vehicle.color }
      : null,
    vehicle.doors
      ? { icon: DoorOpen, label: "Puertas", value: vehicle.doors.toString() }
      : null,
    vehicle.engine
      ? { icon: Car, label: "Motor", value: vehicle.engine }
      : null,
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string }>; label: string; value: string }[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <JsonLd data={pageLd} />

      {/* ViewContent con precio: es lo que le permite a Meta optimizar por VALOR
          y no solo por volumen de clicks. Un dealer que pauta quiere leads de
          las unidades caras, no del auto más barato del stock.
          No-op si el dealer no configuró su pixel. */}
      <MetaTrackEvent
        eventName="ViewContent"
        customData={{
          contentName: vehicle.title,
          contentType: "vehicle",
          contentIds: [vehicle.id],
          contentCategory: vehicle.bodyType ?? undefined,
          value: Number(vehicle.price),
          currency: vehicle.currency,
        }}
      />

      {/* Back */}
      <Link
        href={basePath}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--tenant-fg-muted)] transition-colors hover:text-[var(--tenant-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al catálogo
      </Link>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left: Gallery */}
        <div className="lg:col-span-3">
          <VehicleGallery images={vehicle.images} title={vehicle.title} />
        </div>

        {/* Right: Info */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {vehicle.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                  <Star className="h-3 w-3 fill-current" />
                  Destacado
                </span>
              )}
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                Disponible
              </span>
              <span className="rounded-full bg-[var(--tenant-surface-hover)] px-3 py-1 text-xs font-semibold text-[var(--tenant-fg)]">
                {vehicle.condition === "new" ? "0 km" : "Usado"}
              </span>
            </div>

            {/* Title & Price */}
            <div>
              <h1 className="text-2xl font-extrabold text-[var(--tenant-fg)] sm:text-3xl">
                {vehicle.title}
              </h1>
              <p className="mt-1 text-sm text-[var(--tenant-fg-muted)]">
                {vehicle.brand} {vehicle.model} · {vehicle.year}
              </p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[var(--tenant-fg)] sm:text-4xl">
                  {formatPrice(vehicle.price, vehicle.currency)}
                </span>
                <span className="text-sm font-medium uppercase text-[var(--tenant-fg-subtle)]">
                  {vehicle.currency}
                </span>
              </div>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-3">
              {specs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex items-center gap-3 rounded-2xl bg-[var(--tenant-bg)] px-4 py-3 transition-colors hover:bg-[var(--tenant-surface-hover)]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--tenant-surface-hover)]">
                    <spec.icon className="h-4 w-4 text-[var(--tenant-fg-muted)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--tenant-fg-subtle)]">
                      {spec.label}
                    </p>
                    <p className="truncate text-sm font-semibold text-[var(--tenant-fg)]">
                      {spec.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* WhatsApp CTA */}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:bg-[#20bd5a] hover:shadow-xl active:scale-[0.98]"
              >
                <MessageCircle className="h-5 w-5" />
                Consultar por WhatsApp
              </a>
            )}

            {/* Compartir (punto 22). Secundario a propósito: la conversión es
                consultar, compartir es la vía por la que el auto llega a alguien
                que todavía no visitó el sitio. */}
            <ShareButton
              title={vehicle.title}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--tenant-border)] px-6 py-3 text-sm font-medium text-[var(--tenant-fg-muted)] transition-colors hover:bg-[var(--tenant-surface-hover)] hover:text-[var(--tenant-fg)]"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      {vehicle.description && (
        <section className="mt-12 rounded-3xl bg-[var(--tenant-bg)] p-8 sm:p-10">
          <h2 className="mb-4 text-xl font-bold text-[var(--tenant-fg)]">
            Descripción
          </h2>
          <p className="whitespace-pre-line leading-relaxed text-[var(--tenant-fg-muted)]">
            {vehicle.description}
          </p>
        </section>
      )}

      {/* Contact Form */}
      <section className="mt-12 rounded-3xl bg-[var(--tenant-surface)] shadow-sm ring-1 ring-gray-900/5 p-8 sm:p-10">
        <h2 className="mb-2 text-xl font-bold text-[var(--tenant-fg)]">
          Consultá por este vehículo
        </h2>
        <p className="mb-6 text-sm text-[var(--tenant-fg-muted)]">
          Completá el formulario y te contactamos.
        </p>
        <TenantContactForm
          slug={slug}
          vehicleId={vehicle.id}
          vehicleTitle={vehicle.title}
        />
      </section>
    </div>
  );
}
