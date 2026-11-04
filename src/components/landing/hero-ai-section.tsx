import { getPrimaryCta } from "@/lib/seo";
import { HeroChatDemo } from "./hero-chat-demo";
import { PrimaryCta } from "./primary-cta";

/**
 * Hero: el diferencial es manejar la concesionaria escribiendo, con el Asistente
 * IA que viene adentro del panel (sin configurar nada). Claude/ChatGPT quedan
 * como alternativa en integraciones y FAQ. Titular amplio ("con IA") y lo
 * concreto en el subtítulo y el chat.
 *
 * Entra en UNA pantalla en desktop: ocupa 100svh (menos la barra) y el titular
 * escala con el menor entre ancho y alto (min(vw, svh)), así no se desborda en
 * notebooks de 720px de alto ni con zoom. En mobile se apila: texto y CTA
 * primero, el chat debajo.
 * Sin FadeIn ni JS: el titular es el elemento LCP y tiene que pintar al toque.
 */
export function HeroAiSection() {
  const cta = getPrimaryCta();

  return (
    <section className="relative -mt-16 overflow-hidden bg-paper px-4 pb-14 pt-28 sm:px-6 lg:flex lg:min-h-svh lg:items-center lg:pb-10 lg:pt-24">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="text-center lg:col-span-7 lg:text-left">
          <h1 className="mx-auto max-w-xl font-display text-[clamp(2.4rem,min(5.4vw,9svh),4.5rem)] font-light leading-[1.05] tracking-tight text-ink text-balance lg:mx-0">
            Manejá tu concesionaria con <span className="font-normal text-brand">IA</span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-ink-soft sm:text-lg lg:mx-0">
            Escribí{" "}
            <span className="text-ink underline decoration-accent-amber decoration-[3px] underline-offset-[5px]">
              «cargame el Corolla 2019»
            </span>{" "}
            en el asistente
            de motorflow y ya está en tu web. Sin instalar nada.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <PrimaryCta href={cta.href} size="lg" className="w-full sm:w-auto">
              {cta.label}
            </PrimaryCta>
            <a
              href="#pedidos"
              className="text-sm text-ink-soft underline decoration-ink/20 underline-offset-4 transition hover:text-ink hover:decoration-ink"
            >
              Ver ejemplos
            </a>
          </div>
        </div>

        <div className="lg:col-span-5">
          <HeroChatDemo />
        </div>
      </div>
    </section>
  );
}
