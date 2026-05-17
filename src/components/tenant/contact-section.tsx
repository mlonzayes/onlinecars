import { Section } from "./section";
import { TenantContactForm } from "./contact-form";
import type {
  TenantHomeBundleDealership,
  TenantHomeBundleSection,
} from "@/lib/tenant";

interface ContactSectionProps {
  section: TenantHomeBundleSection;
  dealership: TenantHomeBundleDealership;
}

// Sección "Contacto". Envuelve TenantContactForm. El mapa y el WhatsApp toggle
// del config quedan para una iteración futura (el FAB de WhatsApp ya vive en el
// layout). showMap también queda como TODO.
export function ContactSection({ section, dealership }: ContactSectionProps) {
  return (
    <Section
      background="muted"
      id="contacto"
      eyebrow="Estamos para ayudarte"
      title={section.title}
      description={section.subtitle ?? section.content ?? undefined}
    >
      <div className="mx-auto max-w-2xl">
        <TenantContactForm slug={dealership.slug} />
      </div>
    </Section>
  );
}
