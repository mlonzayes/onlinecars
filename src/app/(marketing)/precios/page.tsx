import { Navbar } from "@/components/shared/navbar";
import { PricingTable } from "@/components/landing/pricing-table";
import { PricingDisclaimer } from "@/components/landing/pricing-disclaimer";
import { Footer } from "@/components/shared/footer";
import { MetaTrackEvent } from "@/components/meta/meta-track-event";

export const metadata = {
  title: "Precios | motorflow",
  description: "Compará nuestros planes y elegí el que mejor se adapte a tu concesionario.",
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
      <main className="flex-1 bg-gray-50 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Compará nuestros planes</h1>
            <p className="mt-4 text-lg text-gray-500">
              Elegí el plan que mejor se adapte a tu concesionario y empezá a vender online.
            </p>
          </div>
          <PricingTable />
          <div className="mt-8">
            <PricingDisclaimer />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
