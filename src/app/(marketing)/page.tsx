import type { Metadata } from "next";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { HeroAiSection } from "@/components/landing/hero-ai-section";
import { ProblemStorySection } from "@/components/landing/problem-story-section";
import { AiRequestsSection } from "@/components/landing/ai-requests-section";
import { SystemShowcaseSection } from "@/components/landing/system-showcase-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { OnboardingStepsSection } from "@/components/landing/onboarding-steps-section";
import { FounderSection } from "@/components/landing/founder-section";
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
 *   mid-cta-section · testimonials-section (testimonios ficticios) · blog-section
 */

export const metadata: Metadata = {
  title: { absolute: "Sistema para concesionarias que manejás con IA | motorflow" },
  description:
    "Tu web, tu stock, tus consultas y el margen de cada auto. Cargá un auto o un gasto escribiéndole a Claude o ChatGPT. Probalo 15 días gratis.",
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
          { "@type": "Offer", name: "Base", price: "19990", priceCurrency: "ARS" },
          { "@type": "Offer", name: "Media", price: "49990", priceCurrency: "ARS" },
          { "@type": "Offer", name: "Premium", price: "99990", priceCurrency: "ARS" },
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
      <Navbar />

      <main className="flex-1">
        {/* 1. Hero — IA como diferencial + chat que carga un auto (LCP = titular) */}
        <HeroAiSection />
        {/* 2. Problema — el mismo auto en tres lados, contado con detalles del rubro */}
        <ProblemStorySection />
        {/* 3. Qué le pedís a la IA — prueba del diferencial + CTA */}
        <AiRequestsSection />
        {/* 4. El sistema detrás — capturas reales del producto */}
        <SystemShowcaseSection />
        {/* 5. Integraciones — solo las que existen hoy */}
        <IntegrationsSection />
        {/* 6. Cómo arrancás — el onboarding conecta la IA */}
        <OnboardingStepsSection />
        {/* 7. Quién está detrás + garantías (prueba honesta sin testimonios) */}
        <FounderSection />
        {/* 8. Precios */}
        <PricingSection />
        {/* 9. FAQ + contacto secundario */}
        <FaqContactSection />
        {/* 10. CTA final */}
        <FinalCtaSection />
      </main>

      <Footer />
      <WhatsAppFab />
      <MobileStickyCta href={cta.href} label={cta.shortLabel} />
      <Toaster />
    </div>
  );
}
