import Link from "next/link";
import { PricingCards } from "./pricing-cards";
import { PricingDisclaimer } from "./pricing-disclaimer";
import { SectionHeading } from "./section-heading";

/** Precios. Límites reales en PLAN_LIMITS (src/lib/plans.ts). */
export function PricingSection() {
  return (
    <section id="planes" className="scroll-mt-20 bg-white px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title="Precios simples" subtitle="Sin comisión por venta." />

        <div className="mt-12">
          <PricingCards />
        </div>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link href="/precios" className="text-sm text-brand underline-offset-4 hover:underline">
            Comparar planes en detalle
          </Link>
          <PricingDisclaimer />
        </div>
      </div>
    </section>
  );
}
