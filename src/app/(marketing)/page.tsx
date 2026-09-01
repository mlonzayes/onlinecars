import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { ProductShowcase } from "@/components/landing/product-showcase";
import { DifferentiatorsSection } from "@/components/landing/differentiators-section";
import { GuaranteesSection } from "@/components/landing/guarantees-section";
import { PricingCards } from "@/components/landing/pricing-cards";
import { PricingDisclaimer } from "@/components/landing/pricing-disclaimer";
import { FaqContactSection, getFaqs } from "@/components/landing/faq-contact-section";
import { WhatsAppFab } from "@/components/landing/whatsapp-fab";
import { Toaster } from "@/components/ui/sonner";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_EMAIL, SITE_PHONE } from "@/lib/seo";
import { COUNTRIES, COUNTRY_LABELS } from "@/lib/constants";

/**
 * Landing de motorflow — 7 secciones.
 *
 * Pasó de 14 a 7 en el rediseño. Lo que se sacó NO fue por largo, fue por
 * repetido: Solution, Services y Benefits decían lo mismo que el showcase con
 * otras palabras (el argumento "sitio propio" aparecía 4 veces, "MercadoLibre"
 * 5). Repetir un argumento cuatro veces no lo refuerza — hace que dejen de
 * creerte, y te da cuatro oportunidades más de que cierren la pestaña.
 *
 * Componentes archivados (siguen en el repo, sin importar):
 *   solution-section · vehicle-types-section · services-section (+ roadmap-*) ·
 *   benefits-section · dealer-workflow-section · mid-cta-section ·
 *   testimonials-section (testimonios ficticios) · blog-section
 *
 * El blog NO se borró del sitio: sigue en /blog, en el navbar y en el footer.
 * Se sacó de la home porque era una salida de tráfico a un scroll del CTA final.
 */

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
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <JsonLd data={buildStructuredData()} />
      <Navbar />

      <main className="flex-1">
        {/* 1. Hero — promesa + screenshot (LCP) */}
        <HeroSection />

        {/* 2. Problema — tensión: dependencia de ML, invisibilidad, caos operativo */}
        <ProblemSection />

        {/* 3. Producto en acción — el screenshot ES el argumento (absorbe Solución) */}
        <ProductShowcase />

        {/* 4. Diferenciadores — 3, no 12 (absorbe Beneficios + Servicios) */}
        <DifferentiatorsSection />

        {/* 5. Garantías — quita riesgo JUSTO antes del precio (reemplaza testimonios) */}
        <GuaranteesSection />

        {/* 6. Precios — filtra y califica el lead */}
        <section id="planes" className="bg-white px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-widest text-blue-600">
                Precios
              </p>
              <h2 className="mt-3 text-2xl font-normal tracking-tight text-gray-900 sm:text-3xl">
                Planes simples y transparentes
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm font-light text-gray-600">
                Pagás por mes, sin comisiones por venta. Cancelás cuando quieras.
              </p>
            </div>
            <div className="mt-12">
              <PricingCards />
            </div>
            <div className="mt-6">
              <PricingDisclaimer />
            </div>
          </div>
        </section>

        {/* 7. FAQ + Contacto — objeciones y conversión, sin corte entre medio */}
        <FaqContactSection />
      </main>

      <Footer />
      <WhatsAppFab />
      <Toaster />
    </div>
  );
}
