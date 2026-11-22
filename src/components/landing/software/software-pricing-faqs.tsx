import Link from "next/link";
import { SOFTWARE_FAQS } from "@/data/software-page";
import { PricingDisclaimer } from "../pricing-disclaimer";

/**
 * Precio resumido + preguntas frecuentes. Las FAQ van abiertas (dl, no
 * details): el texto completo queda visible para el lector y para los
 * crawlers, y es la misma fuente que arma el FAQPage del JSON-LD.
 */
export function SoftwarePricingFaqs() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <h2 className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] font-light leading-[1.1] tracking-tight text-ink">
            Cuánto cuesta
          </h2>
          <dl className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
            {[
              ["Base", "$23.990", "1 usuario, hasta 30 autos"],
              ["Media", "$59.990", "3 usuarios, 100 autos y Mercado Libre"],
              ["Premium", "$119.990", "Sin límite de autos ni usuarios"],
            ].map(([plan, price, detail]) => (
              <div key={plan} className="flex items-baseline justify-between gap-4 py-4">
                <dt>
                  <span className="text-base text-ink">{plan}</span>
                  <span className="block text-sm text-ink-soft">{detail}</span>
                </dt>
                <dd className="shrink-0 font-display text-xl font-light text-ink">
                  {price}
                  <span className="text-sm text-ink-soft"> /mes</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-ink-soft">Precio fijo, sin comisión por venta.</p>
          <div className="mt-3 [&_p]:mx-0 [&_p]:text-left">
            <PricingDisclaimer />
          </div>
          <Link href="/precios" className="mt-5 inline-block text-sm text-brand underline-offset-4 hover:underline">
            Comparar todo lo que incluye cada plan
          </Link>
        </div>

        <div className="lg:col-span-7">
          <h2 className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] font-light leading-[1.1] tracking-tight text-ink">
            Preguntas frecuentes
          </h2>
          <dl className="mt-6 space-y-6">
            {SOFTWARE_FAQS.map((f) => (
              <div key={f.question}>
                <dt className="text-base font-normal text-ink">{f.question}</dt>
                <dd className="mt-1.5 text-base leading-relaxed text-ink-soft">{f.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
