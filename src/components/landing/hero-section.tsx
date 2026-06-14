import Image from "next/image";
import Link from "next/link";
import { PiArrowRight, PiCheckCircle } from "react-icons/pi";
import { FadeIn } from "./fade-in";

const CHECKS = [
  "Sin comisiones por venta",
  "Tu marca, tu dominio",
  "Listo en el día",
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white px-4 pb-0 pt-24 sm:pt-32">
      <div className="mx-auto max-w-2xl text-center">
        <FadeIn delay={0.1}>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-[3.25rem]">
            Vendé más autos desde tu{" "}
            <span className="text-blue-600">propio sitio.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mx-auto mt-5 max-w-xl text-base font-light leading-relaxed text-gray-500">
            Tu sitio web profesional, tu catálogo siempre actualizado y las
            consultas que llegan directo a vos. Sin comisiones por venta y sin
            depender de los portales.
          </p>
        </FadeIn>

        <FadeIn delay={0.3} className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Empezar gratis
            <PiArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#planes"
            className="inline-flex items-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-900 hover:text-gray-900"
          >
            Ver planes
          </a>
        </FadeIn>

        <FadeIn delay={0.4} className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {CHECKS.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 text-xs font-light text-gray-400">
              <PiCheckCircle className="h-3.5 w-3.5 text-blue-500" />
              {c}
            </span>
          ))}
        </FadeIn>
      </div>

      {/* Product screenshot */}
      <div className="mx-auto mt-16 max-w-5xl">
        <FadeIn delay={0.5}>
          <div className="overflow-hidden rounded-t-2xl border border-b-0 border-gray-200/80 shadow-2xl shadow-blue-100/60">
            {/* Browser chrome */}
            <div className="flex items-center gap-3 border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur-sm">
              <div className="flex gap-1.5 shrink-0">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-300/80" />
              </div>
              <div className="flex flex-1 justify-center">
                <span className="flex max-w-[220px] flex-1 items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-center text-[10px] text-gray-400">
                  motorflowapp.com/mi-concesionario
                </span>
              </div>
            </div>
            <Image
              src="/mockups/website_mockup_1778627472208.png"
              alt="Sitio público del concesionario en motorflow"
              width={1200}
              height={700}
              className="w-full"
              priority
            />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
