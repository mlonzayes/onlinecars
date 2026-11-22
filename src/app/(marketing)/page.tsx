import type { Metadata } from "next";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { HeroAiSection } from "@/components/landing/hero-ai-section";
import { AiRequestsSection } from "@/components/landing/ai-requests-section";
import { SystemShowcaseSection } from "@/components/landing/system-showcase-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { OnboardingStepsSection } from "@/components/landing/onboarding-steps-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { FaqContactSection, getFaqs } from "@/components/landing/faq-contact-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { MobileStickyCta } from "@/components/landing/mobile-sticky-cta";
import { WhatsAppFab } from "@/components/landing/whatsapp-fab";
import { Toaster } from "@/components/ui/sonner";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_EMAIL, SITE_PHONE, getPrimaryCta } from "@/lib/seo";
import { COUNTRIES, COUNTRY_LABELS } from "@/lib/constants";

/**
 * Landing de motorflow — rediseño "manejá tu concesionaria con IA".
 *
 * Brief, copy y pendientes en .agents/landing-brief.md (skill landing-que-vende).
 * Tráfico principal: Meta Ads en celular. Acción única: crear cuenta (prueba de
 * 15 días). El form de contacto queda como salida secundaria en la FAQ.
 *
 * Componentes archivados (siguen en el repo, sin importar):
 *   hero-section · problem-section · product-showcase · differentiators-section ·
 *   guarantees-section · solution-section · vehicle-types-section ·
 *   services-section (+ roadmap-*) · benefits-section · dealer-workflow-section ·
 *   mid-cta-section · testimonials-section (testimonios ficticios) · blog-section ·
 *   founder-section · problem-story-section
 */

export const metadata: Metadata = {
  // "gestión" + "concesionarias" en el título: es como busca el dueño que no
  // conoce la marca. "agencias de autos" va en la descripción por lo mismo.
  title: { absolute: "Sistema de gestión para concesionarias, con IA | motorflow" },
  description:
    "Software para concesionarias y agencias de autos: tu web, el stock, las consultas y el margen de cada auto en un panel. Cargá autos escribiéndole al asistente con IA.",
};

// Structured data (schema.org) — la leen Google (rich results / FAQ) y los
// motores de IA para entender qué es motorflow, qué ofrece y a qué precio.
// Las FAQ salen de getFaqs(), la MISMA fuente que renderiza la sección: si se
// edita una pregunta, el JSON-LD la sigue solo y no queda mintiéndole a Google.
const ORG_ID = `${SITE_URL}/#organization`;

function buildStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/logo/motorflow_light.png`,
        description: SITE_DESCRIPTION,
        email: SITE_EMAIL,
        telephone: SITE_PHONE,
        // Derivado de COUNTRIES: es el dato que Google y los motores de IA leen
        // para saber a qué mercados llegamos. Hardcodear "Argentina" acá nos
        // dejaba fuera de cualquier consulta hecha desde México, Chile o España.
        areaServed: COUNTRIES.map((c) => ({
          "@type": "Country",
          name: COUNTRY_LABELS[c],
        })),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: "es-AR",
        publisher: { "@id": ORG_ID },
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        publisher: { "@id": ORG_ID },
        offers: [
          { "@type": "Offer", name: "Base", price: "23990", priceCurrency: "ARS" },
          { "@type": "Offer", name: "Media", price: "59990", priceCurrency: "ARS" },
          { "@type": "Offer", name: "Premium", price: "119990", priceCurrency: "ARS" },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: getFaqs().map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
    ],
  };
}

export default function HomePage() {
  const cta = getPrimaryCta();

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <JsonLd data={buildStructuredData()} />
      {/* Progreso de lectura: CSS scroll-driven, sin JS (globals.css) */}
      <div aria-hidden className="scroll-progress" />
      <Navbar />

      <main className="flex-1">
        {/* 1. Hero — IA como diferencial + chat que carga un auto (LCP = titular) */}
        <HeroAiSection />
        {/* 2. Qué le pedís a la IA — prueba del diferencial + CTA */}
        <AiRequestsSection />
        {/* 3. El sistema detrás — capturas reales del producto */}
        <SystemShowcaseSection />
        {/* 4. Integraciones — solo las que existen hoy */}
        <IntegrationsSection />
        {/* 5. Cómo arrancás — el onboarding conecta la IA */}
        <OnboardingStepsSection />
        {/* 6. Precios */}
        <PricingSection />
        {/* 7. FAQ + contacto secundario */}
        <FaqContactSection />
        {/* 8. CTA final */}
        <FinalCtaSection />
      </main>

      <Footer />
      <WhatsAppFab />
      <MobileStickyCta href={cta.href} label={cta.shortLabel} />
      <Toaster />
    </div>
  );
}
