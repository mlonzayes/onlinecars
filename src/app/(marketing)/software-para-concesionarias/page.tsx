import type { Metadata } from "next";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { JsonLd } from "@/components/seo/json-ld";
import { MetaTrackEvent } from "@/components/meta/meta-track-event";
import { SoftwareHero } from "@/components/landing/software/software-hero";
import { SoftwareModules } from "@/components/landing/software/software-modules";
import { SoftwareComparison } from "@/components/landing/software/software-comparison";
import { SoftwarePricingFaqs } from "@/components/landing/software/software-pricing-faqs";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { MobileStickyCta } from "@/components/landing/mobile-sticky-cta";
import { WhatsAppFab } from "@/components/landing/whatsapp-fab";
import { SOFTWARE_FAQS } from "@/data/software-page";
import { SITE_URL, getPrimaryCta } from "@/lib/seo";

/**
 * Página pilar para quien busca "software / sistema de gestión para
 * concesionarias" sin conocer la marca. Las páginas por tema (CRM, stock,
 * web, Mercado Libre) y las notas del blog deberían linkear acá.
 */
const PATH = "/software-para-concesionarias";
// ~60 caracteres con el sufijo de marca: más largo, Google lo corta. El H1 es más largo.
const TITLE = "Software para concesionarias y agencias de autos";

export const metadata: Metadata = {
  // El template del root agrega "| MotorFlow".
  title: TITLE,
  description:
    "Sistema para concesionarias y agencias de autos: stock, gastos y margen por unidad, consultas, ventas con legajo y tu página web, en un panel. Desde $23.990 por mes.",
  alternates: { canonical: PATH },
  openGraph: { type: "website", url: `${SITE_URL}${PATH}`, title: TITLE },
};

function buildStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Software para concesionarias", item: `${SITE_URL}${PATH}` },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: SOFTWARE_FAQS.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
    ],
  };
}

export default function SoftwareParaConcesionariasPage() {
  const cta = getPrimaryCta();

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <JsonLd data={buildStructuredData()} />
      <MetaTrackEvent
        eventName="ViewContent"
        customData={{ contentName: "software-para-concesionarias", contentCategory: "saas-motorflow" }}
      />
      <Navbar />
      <main className="flex-1">
        <SoftwareHero />
        <SoftwareModules />
        <SoftwareComparison />
        <SoftwarePricingFaqs />
        <FinalCtaSection />
      </main>
      <Footer />
      <WhatsAppFab />
      <MobileStickyCta href={cta.href} label={cta.shortLabel} />
    </div>
  );
}
