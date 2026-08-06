import { Section } from "./section";
import { TenantContactForm } from "./contact-form";
import { AnimateOnScroll } from "./animate-on-scroll";
import { LocationMap } from "./location-map";
import type {
  TenantHomeBundleDealership,
  TenantHomeBundleSection,
} from "@/lib/tenant";
import type { ContactConfig } from "@/lib/sections/config-types";

interface ContactSectionProps {
  section: TenantHomeBundleSection;
  dealership: TenantHomeBundleDealership;
}

// Sección "Contacto": form + mapa (si el dealer activó la ubicación).
// Las redes sociales NO van acá — viven en el footer para no duplicarlas.
export function ContactSection({ section, dealership }: ContactSectionProps) {
  const config = section.config as ContactConfig;
  // El mapa se muestra si: el dealer lo activó, tiene coords, Y eligió mostrar la
  // dirección. Si ocultó la dirección, ocultamos también el mapa (un pin revela
  // la ubicación igual que el texto — sería contradictorio mostrarlo).
  const showMap =
    config.showMap &&
    dealership.latitude !== null &&
    dealership.longitude !== null &&
    (dealership.showAddress ?? true);

  return (
    <Section
      background="muted"
      id="contacto"
      eyebrow="Estamos para ayudarte"
      title={section.title}
      description={section.subtitle ?? section.content ?? undefined}
    >
      {showMap ? (
        <AnimateOnScroll preset="fadeUp" className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
          <TenantContactForm slug={dealership.slug} />
          <LocationMap
            latitude={dealership.latitude!}
            longitude={dealership.longitude!}
            label={[dealership.address, dealership.city, dealership.province].filter(Boolean).join(", ") || null}
          />
        </AnimateOnScroll>
      ) : (
        <AnimateOnScroll preset="fadeUp" className="mx-auto max-w-2xl">
          <TenantContactForm slug={dealership.slug} />
        </AnimateOnScroll>
      )}
    </Section>
  );
}
