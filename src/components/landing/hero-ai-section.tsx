import { getPrimaryCta } from "@/lib/seo";
import { HeroChatDemo } from "./hero-chat-demo";
import { PrimaryCta } from "./primary-cta";

/**
 * Hero: el diferencial es manejar la concesionaria escribiendo, con el Asistente
 * IA que viene adentro del panel (sin configurar nada). Claude/ChatGPT quedan
 * como alternativa en integraciones y FAQ.
 *
 * Va en un "escenario" redondeado con el wallpaper abstracto de fondo, debajo
 * de la barra (no detrás: la barra es clara y sobre el azul quedaba cortada).
 * Entra en UNA pantalla en desktop: el escenario ocupa 100svh menos la barra y
 * el titular escala con min(vw, svh). En mobile se apila: texto y CTA primero,
 * el iPhone debajo.
 *
 * Performance (PageSpeed 100, no negociable):
 * - El wallpaper es un WebP pre-achicado (13 KB mobile / 38 KB desktop) en un
 *   <img> con fetchPriority alta: el preload scanner lo encuentra en el HTML.
 *   No pasa por next/image: el optimizador en frío sumaba latencia al LCP.
 * - Sin FadeIn ni JS: el titular pinta al toque. El parallax del fondo y del
 *   teléfono es CSS scroll-driven (globals.css), anima solo transform.
 */
export function HeroAiSection() {
  const cta = getPrimaryCta();

  return (
    <section className="px-2 pt-2 sm:px-3 sm:pt-3">
      <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#07114f] px-4 pb-14 pt-14 sm:rounded-[2.25rem] sm:px-6 lg:flex lg:min-h-[calc(100svh-4.75rem)] lg:items-center lg:py-6">
        {/* eslint-disable-next-line @next/next/no-img-element -- ver comentario de performance */}
        <img
          src="/landing/hero-wallpaper-1600.webp"
          srcSet="/landing/hero-wallpaper-800.webp 800w, /landing/hero-wallpaper-1600.webp 1600w"
          sizes="100vw"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="hero-wallpaper absolute inset-0 -z-10 h-full w-full object-cover"
        />
        {/* Velo para que el texto blanco pase contraste AA sobre las zonas claras */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_0%_50%,rgba(4,9,46,0.72),rgba(4,9,46,0.25)_60%,transparent)]"
        />

        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="hero-copy text-center lg:col-span-7 lg:text-left">
            <h1 className="mx-auto max-w-xl font-display text-[clamp(2.4rem,min(5.4vw,9svh),4.5rem)] font-light leading-[1.05] tracking-tight text-white text-balance lg:mx-0">
              Manejá tu concesionaria de manera{" "}
              <span className="font-normal text-[#aebcff]">inteligente</span>
            </h1>

            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/75 sm:text-lg lg:mx-0">
              Escribile al asistente de motorflow y el auto ya está en tu web. Sin instalar nada.
            </p>

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <PrimaryCta
                href={cta.href}
                size="lg"
                className="w-full bg-white text-ink shadow-lg shadow-black/25 hover:bg-white/90 sm:w-auto [a]:hover:bg-white/90"
              >
                {cta.label}
              </PrimaryCta>
              <a
                href="#pedidos"
                className="text-sm text-white/75 underline decoration-white/30 underline-offset-4 transition hover:text-white hover:decoration-white"
              >
                Ver ejemplos
              </a>
            </div>
          </div>

          <div className="lg:col-span-5">
            <HeroChatDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
