import { PiPlus } from "react-icons/pi";
import { SITE_WHATSAPP_URL } from "@/lib/seo";
import { LandingContactForm } from "./contact-form";
import { SectionHeading } from "./section-heading";

export interface Faq {
  question: string;
  answer: string;
}

/**
 * FAQ + contacto. El registro es la acción principal de la página; el form
 * queda como salida para Enterprise y para quien prefiere hablar antes (y es
 * el destino de /#contacto cuando el self-serve está apagado).
 * getFaqs() alimenta también el JSON-LD FAQPage de la home.
 */
export function getFaqs(): Faq[] {
  return [
    { question: "¿Con qué IA funciona?", answer: "Con Claude y ChatGPT. Te la dejamos conectada en el onboarding." },
    { question: "¿Y si no uso IA?", answer: "Todo se hace también desde el panel." },
    { question: "¿La IA puede inventar datos?", answer: "No publica nada sin tu OK: los autos entran como borrador." },
    { question: "¿Cobran comisión por venta?", answer: "No. Pagás el plan y listo." },
    { question: "¿Tengo que dejar Mercado Libre?", answer: "No. Desde el plan Media se sincroniza con tu web." },
    { question: "¿Qué incluye la prueba?", answer: "15 días, hasta 10 autos y 20 pedidos diarios a la IA." },
    { question: "¿Y si no me sirve?", answer: "Cancelás cuando quieras y te llevás tus datos." },
  ];
}

export function FaqContactSection() {
  const faqs = getFaqs();

  return (
    <section id="faq" className="scroll-mt-20 bg-paper px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <SectionHeading title="Preguntas frecuentes" />
          <div className="mt-8 space-y-2">
            {faqs.map((f) => (
              <details key={f.question} className="group rounded-xl border border-ink/10 bg-white open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-base text-ink [&::-webkit-details-marker]:hidden">
                  {f.question}
                  <PiPlus className="size-4 shrink-0 text-ink-soft transition-transform group-open:rotate-45" aria-hidden />
                </summary>
                <p className="px-5 pb-4 text-sm leading-relaxed text-ink-soft">{f.answer}</p>
              </details>
            ))}
          </div>
          <a
            href={SITE_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block text-sm text-brand underline-offset-4 hover:underline"
          >
            ¿Otra duda? Escribinos por WhatsApp
          </a>
        </div>

        <div id="contacto" className="scroll-mt-24 lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-7">
            <h2 className="font-display text-2xl font-light text-ink">Contactanos</h2>
            <div className="mt-5">
              <LandingContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
