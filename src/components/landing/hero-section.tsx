import Image from "next/image";
import Link from "next/link";
import { PiArrowRight, PiCheckCircle } from "react-icons/pi";
import { getPrimaryCta } from "@/lib/seo";

const CHECKS = [
  "Sin comisiones por venta",
  "Tu marca, tu dominio",
  "Listo en el día",
];

// IMPORTANTE: el hero NO usa FadeIn (GSAP) a propósito. La imagen del hero es el
// elemento LCP; animarla con opacity 0→1 vía JS la hacía aparecer recién cuando
// hidrataba GSAP (~2.2s de render delay en mobile). Renderizándola estática,
// pinta al instante. Las animaciones de scroll quedan para debajo del fold.
export function HeroSection() {
  const cta = getPrimaryCta();

  return (
    <section className="relative isolate -mt-[68px] overflow-hidden bg-white px-4 pb-0 pt-40 sm:pt-44">
      {/* Capa decorativa: gradiente base + glows azules suaves (animados, sutil).
          aria-hidden + pointer-events-none: es puramente visual. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-200 via-blue-50 to-white" />
        <div className="hero-glow absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-500/45 blur-3xl" />
        <div
          className="hero-glow-alt absolute -right-24 -top-12 h-[30rem] w-[30rem] rounded-full bg-sky-400/55 blur-3xl"
          style={{ animationDelay: "-6s" }}
        />
        <div
          className="hero-glow absolute left-1/3 top-40 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-cyan-300/55 blur-3xl"
          style={{ animationDelay: "-11s" }}
        />
        <div
          className="hero-glow-alt absolute -bottom-16 left-10 h-72 w-72 rounded-full bg-blue-400/40 blur-3xl"
          style={{ animationDelay: "-3s" }}
        />
      </div>

      <div className="relative mx-auto max-w-2xl text-center">
        {/* Peso 300 a 64px: la finura se gana en el display, no en el body.
            tracking-tight es obligatorio acá — las letras light a este tamaño
            se ven desparramadas sin cerrar el interletrado. */}
        <h1 className="text-5xl font-light leading-[1.05] tracking-tight text-gray-900 sm:text-[3.5rem] lg:text-[4rem]">
          Vendé más vehículos desde tu{" "}
          <span className="font-normal text-blue-600">propio sitio.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base font-light leading-relaxed text-gray-600">
          Tu sitio web profesional, tu catálogo siempre actualizado y las
          consultas que llegan directo a vos. Sin comisiones por venta y sin
          depender de los portales.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={cta.href}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            {cta.label}
            <PiArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#planes"
            className="inline-flex items-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-900 hover:text-gray-900"
          >
            Ver planes
          </a>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {CHECKS.map((c) => (
            // Micro-copy a 12px SUBE de peso (400), no baja: a 300 los trazos
            // se desarman en pantallas sin buen antialiasing (Windows @125%).
            <span key={c} className="inline-flex items-center gap-1.5 text-xs font-normal text-gray-600">
              <PiCheckCircle className="h-3.5 w-3.5 text-blue-500" />
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Product screenshot (elemento LCP) */}
      <div className="mx-auto mt-24 max-w-5xl sm:mt-32">
        <div className="overflow-hidden rounded-t-2xl border border-b-0 border-gray-200/80 shadow-2xl shadow-blue-100/60">
          {/* Browser chrome */}
          <div className="flex items-center gap-3 border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur-sm">
            <div className="flex gap-1.5 shrink-0">
              <span className="h-2.5 w-2.5 rounded-full bg-red-300/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-300/80" />
            </div>
            <div className="flex flex-1 justify-center">
              <span className="flex max-w-[220px] flex-1 items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-center text-[10px] text-gray-600">
                app.motorflowapp.com/dashboard
              </span>
            </div>
          </div>
          <Image
            src="/mockups/inventory.png"
            alt="Panel de gestión de motorflow"
            width={1347}
            height={595}
            sizes="(max-width: 1024px) 100vw, 1024px"
            quality={90}
            className="hero-shot w-full"
            priority
          />
        </div>
      </div>
    </section>
  );
}
