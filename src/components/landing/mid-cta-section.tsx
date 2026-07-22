import Image from "next/image";
import Link from "next/link";
import { PiArrowRight } from "react-icons/pi";
import { FadeIn } from "./fade-in";

export function MidCtaSection() {
  return (
    <section className="relative isolate overflow-hidden px-4 py-20 sm:py-28">
      {/* Foto de showroom de fondo + overlay azul: mantiene el color de marca y
          garantiza contraste para el texto blanco (era un bloque azul plano). */}
      <Image
        src="/premium_images/P1_hero_background.png"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover object-center"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-900/90 via-blue-950/85 to-gray-950/90"
      />

      <FadeIn className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">
          Probalo gratis por 15 días
        </h2>
        <p className="mt-3 text-sm font-light text-blue-100">
          Sin tarjeta de crédito. Cancelás cuando querás.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-blue-700 shadow-lg transition hover:bg-blue-50"
          >
            Crear mi concesionario
            <PiArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#contacto"
            className="inline-flex items-center rounded-lg border border-white/40 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/10"
          >
            Tengo dudas
          </a>
        </div>
      </FadeIn>
    </section>
  );
}
