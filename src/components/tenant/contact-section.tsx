import { Section } from "./section";
import { TenantContactForm } from "./contact-form";
import { AnimateOnScroll } from "./animate-on-scroll";
import { LocationMap } from "./location-map";
import { SocialBar } from "./social-bar";
import type {
  TenantHomeBundleDealership,
  TenantHomeBundleSection,
} from "@/lib/tenant";
import type { ContactConfig } from "@/lib/sections/config-types";

interface ContactSectionProps {
  section: TenantHomeBundleSection;
  dealership: TenantHomeBundleDealership;
}

// Sección "Contacto": form + mapa (si el dealer activó la ubicación) + barra de
// redes sociales. Si no hay mapa, el form queda centrado como antes.
export function ContactSection({ section, dealership }: ContactSectionProps) {
  const config = section.config as ContactConfig;
  // El mapa se muestra si el dealer lo activó en la sección Y cargó su dirección.
  const showMap =
    config.showMap &&
    dealership.latitude !== null &&
    dealership.longitude !== null;

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

      {/* Barra de redes — se auto-oculta si no hay ninguna cargada. */}
      <SocialBar socialLinks={dealership.socialLinks} className="mt-10 justify-center" />
    </Section>
  );
}
