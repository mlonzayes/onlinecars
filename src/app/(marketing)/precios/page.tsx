import { Navbar } from "@/components/shared/navbar";
import { PricingTable } from "@/components/landing/pricing-table";
import { PricingDisclaimer } from "@/components/landing/pricing-disclaimer";
import { ServicesSection } from "@/components/landing/services-section";
import { Footer } from "@/components/shared/footer";
import { MetaTrackEvent } from "@/components/meta/meta-track-event";
import type { Metadata } from "next";

// El `title.template` del root layout ya agrega "| MotorFlow" — no repitas la
// marca acá o sale duplicada en el SERP.
// `alternates.canonical` es OBLIGATORIO: el root declara canonical "/" y las
// pages que no lo pisan lo heredan, o sea le dicen a Google que son una copia
// de la home y no las indexa aparte.
export const metadata: Metadata = {
  title: "Precios y planes para concesionarias",
  description:
    "Planes desde $19.990 por mes para tu concesionaria: sitio web propio, catálogo ilimitado y gestión de leads. Sin comisiones por venta y cancelás cuando quieras.",
  alternates: { canonical: "/precios" },
};

export default function PreciosPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Mirar los planes es la señal de intención más fuerte antes del form.
          Es el público al que después le hacés retargeting: entró a precios y
          no convirtió. Sin este evento, ese público no existe. */}
      <MetaTrackEvent
        eventName="ViewContent"
        customData={{ contentName: "precios", contentCategory: "saas-motorflow" }}
      />
      <Navbar />
      <main className="flex-1">
        <div className="bg-gray-50 px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h1 className="text-3xl font-light tracking-tight text-gray-900 sm:text-4xl">
                Compará nuestros planes
              </h1>
              <p className="mt-4 text-lg font-light text-gray-600">
                Elegí el plan que mejor se adapte a tu concesionario y empezá a
                vender online.
              </p>
            </div>
            <PricingTable />
            <div className="mt-8">
              <PricingDisclaimer />
            </div>
          </div>
        </div>

        {/* Servicios + roadmap: se mudaron acá desde la home. En la landing
            mezclaban lo que EXISTE con lo que va a existir, y el que se
            interesaba por una feature futura se iba al no encontrarla. Acá el
            visitante ya mostró intención — el roadmap suma en vez de distraer. */}
        <ServicesSection />
      </main>
      <Footer />
    </div>
  );
}
