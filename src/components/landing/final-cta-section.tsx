import { getPrimaryCta } from "@/lib/seo";
import { PrimaryCta } from "./primary-cta";

/**
 * Cierre: una línea de valor y el CTA. Los 15 días se dicen una sola vez.
 * Repite el wallpaper del hero (mismo archivo, ya está en cache: cero bytes
 * extra) con un panel de vidrio encima, para cerrar la página como abrió.
 */
export function FinalCtaSection() {
  const cta = getPrimaryCta();

  return (
    <section className="relative isolate overflow-hidden bg-navy px-4 py-16 text-white sm:px-6 sm:py-24">
      {/* eslint-disable-next-line @next/next/no-img-element -- mismo WebP estático del hero */}
      <img
        src="/landing/hero-wallpaper-1600.webp"
        srcSet="/landing/hero-wallpaper-800.webp 800w, /landing/hero-wallpaper-1600.webp 1600w"
        sizes="100vw"
        alt=""
        loading="lazy"
        decoding="async"
        className="sd-drift-down absolute inset-[-80px_0] -z-10 h-[calc(100%+160px)] w-full object-cover"
      />
      {/* Velo: el wallpaper solo era muy brillante para un cierre */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[#030828]/60" />

      <div className="glass-card-dark sd-zoom mx-auto flex max-w-6xl flex-col items-center gap-8 rounded-3xl px-6 py-10 text-center sm:px-10 sm:py-12 lg:flex-row lg:justify-between lg:text-left">
        <div>
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-light leading-[1.05] tracking-tight text-balance">
            Cargá tu primer auto hoy
          </h2>
          <p className="mt-3 text-base text-white/75 sm:text-lg">15 días gratis, con tu stock.</p>
        </div>
        <PrimaryCta
          href={cta.href}
          size="lg"
          className="w-full bg-white text-ink shadow-lg shadow-black/25 hover:bg-white/90 sm:w-auto [a]:hover:bg-white/90"
        >
          {cta.shortLabel}
        </PrimaryCta>
      </div>
    </section>
  );
}
