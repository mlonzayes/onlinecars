import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { SolutionSection } from "@/components/landing/solution-section";
import { VehicleTypesSection } from "@/components/landing/vehicle-types-section";
import { ServicesSection } from "@/components/landing/services-section";
import { BenefitsSection } from "@/components/landing/benefits-section";
import { DealerWorkflowSection } from "@/components/landing/dealer-workflow-section";
import { MidCtaSection } from "@/components/landing/mid-cta-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { BlogSection } from "@/components/landing/blog-section";
import { ProductShowcase } from "@/components/landing/product-showcase";
import { PricingCards } from "@/components/landing/pricing-cards";
import { PricingDisclaimer } from "@/components/landing/pricing-disclaimer";
import { FaqItem } from "@/components/landing/faq-item";
import { LandingContactForm } from "@/components/landing/contact-form";
import { WhatsAppFab } from "@/components/landing/whatsapp-fab";
import { Toaster } from "@/components/ui/sonner";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_EMAIL, SITE_PHONE } from "@/lib/seo";
import { getRecentPosts } from "@/data/posts";

const FAQS: { question: string; answer: string }[] = [
  {
    question: "¿Cómo contrato un plan?",
    answer:
      "Dejanos tu consulta en el formulario de contacto y un asesor se va a comunicar con vos para coordinar el alta de tu concesionario.",
  },
  {
    question: "¿Necesito conocimientos técnicos?",
    answer:
      "No. El alta y la carga de vehículos se hace desde un panel pensado para no-técnicos. Si querés un dominio propio, te ayudamos con la configuración.",
  },
  {
    question: "¿Puedo migrar mi stock actual de MercadoLibre?",
    answer:
      "Sí. La integración con MercadoLibre te permite traer tus publicaciones existentes y mantenerlas sincronizadas con tu nuevo sitio.",
  },
  {
    question: "¿Qué pasa si no me sirve?",
    answer:
      "Cancelás cuando querás, sin permanencia. Tu información la podés exportar en cualquier momento — son tus datos.",
  },
  {
    question: "¿Cobran comisiones por venta?",
    answer:
      "No. motorflow no cobra comisiones por venta. Solo pagás la suscripción mensual del plan elegido. Lo que vendés es 100% tuyo.",
  },
  {
    question: "¿Cuánto tarda el alta?",
    answer:
      "El mismo día. Creás tu cuenta, completás los datos del concesionario y en minutos tenés el sitio listo para cargar stock.",
  },
];

// Structured data (schema.org) — la leen Google (rich results / FAQ) y los
// motores de IA para entender qué es motorflow, qué ofrece y a qué precio.
const ORG_ID = `${SITE_URL}/#organization`;
const structuredData = {
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
      areaServed: { "@type": "Country", name: "Argentina" },
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
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ],
};

export default function HomePage() {
  const recentPosts = getRecentPosts(3);

  return (
    <div className="flex min-h-screen flex-col bg-blue-100">
      <JsonLd data={structuredData} />
      <Navbar />

      <main className="flex-1">
        {/* 1. Hero */}
        <HeroSection />

        {/* 2. Problema */}
        <ProblemSection />

        {/* 3. Solución */}
        <SolutionSection />

        {/* 3a. Tipos de vehículos (renders P10) */}
        <VehicleTypesSection />

        {/* 3b. Showcase del producto (screenshots reales) */}
        <ProductShowcase />

        {/* 3c. Servicios + roadmap (ancla #servicios del navbar/menú) */}
        <ServicesSection />

        {/* 4. Beneficios */}
        <BenefitsSection />

        {/* 4b. Banda narrativa con fotos reales (foto → gestión → cierre) */}
        <DealerWorkflowSection />

        {/* 5. Mid CTA */}
        <MidCtaSection />

        {/* 6. Testimonios */}
        <TestimonialsSection />

        {/* 7. Pricing */}
        <section id="planes" className="bg-white px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-widest text-blue-600">
                Precios
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-gray-900 sm:text-3xl">
                Planes simples y transparentes
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm font-light text-gray-500">
                Pagás por mes, sin comisiones por venta. Cancelás cuando querás.
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

        {/* 8. Blog */}
        <BlogSection posts={recentPosts} />

        {/* 9. FAQ */}
        <section id="faq" className="bg-gray-50 px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-widest text-blue-600">
                FAQ
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-gray-900 sm:text-3xl">
                Preguntas frecuentes
              </h2>
              <p className="mt-3 text-sm font-light text-gray-500">
                Lo que más nos preguntan antes de empezar.
              </p>
            </div>
            <div className="mt-10 flex flex-col gap-2.5">
              {FAQS.map((f) => (
                <FaqItem key={f.question} question={f.question} answer={f.answer} />
              ))}
            </div>
          </div>
        </section>

        {/* 10. CTA final + contacto */}
        <section id="contacto" className="bg-blue-50 px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
              ¿Listo para dar el salto?
            </h2>
            <p className="mt-3 text-sm font-light text-gray-600">
              Completá el formulario y nos comunicamos para ayudarte a poner tu
              concesionario online.
            </p>
            <div className="mt-8 rounded-2xl border border-blue-100 bg-white p-6 text-left shadow-sm sm:p-8">
              <LandingContactForm />
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppFab />
      <Toaster />
    </div>
  );
}
