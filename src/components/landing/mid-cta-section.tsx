import Link from "next/link";
import { PiArrowRight } from "react-icons/pi";
import { FadeIn } from "./fade-in";

export function MidCtaSection() {
  return (
    <section className="bg-blue-600 px-4 py-14 sm:py-16">
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
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
          >
            Crear mi concesionario
            <PiArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#contacto"
            className="inline-flex items-center rounded-lg border border-white/40 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Tengo dudas
          </a>
        </div>
      </FadeIn>
    </section>
  );
}
