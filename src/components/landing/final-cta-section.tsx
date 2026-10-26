import { getPrimaryCta } from "@/lib/seo";
import { PrimaryCta } from "./primary-cta";

/** Cierre: una línea de valor y el CTA. Los 15 días se dicen una sola vez. */
export function FinalCtaSection() {
  const cta = getPrimaryCta();

  return (
    <section className="bg-navy px-4 py-16 text-white sm:px-6 sm:py-24">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 text-center lg:flex-row lg:justify-between lg:text-left">
        <div>
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-light leading-[1.05] tracking-tight text-balance">
            Cargá tu primer auto hoy
          </h2>
          <p className="mt-3 text-base text-white/70 sm:text-lg">15 días gratis, con tu stock.</p>
        </div>
        <PrimaryCta href={cta.href} size="lg" className="w-full sm:w-auto">
          {cta.shortLabel}
        </PrimaryCta>
      </div>
    </section>
  );
}
