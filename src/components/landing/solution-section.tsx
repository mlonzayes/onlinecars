import Image from "next/image";
import { PiCheckCircle } from "react-icons/pi";
import { FadeIn } from "./fade-in";

const FEATURES = [
  "Sitio web con tu marca y dominio propio",
  "Catálogo de vehículos actualizable en tiempo real",
  "CRM de leads, clientes y seguimientos",
  "Panel de ventas con legajo digital de documentos",
  "Integración con MercadoLibre desde un solo lugar",
];

export function SolutionSection() {
  return (
    <section className="bg-white px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-widest text-blue-600">
              La solución
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-gray-900 sm:text-3xl">
              Cómo motorflow ordena tu negocio
            </h2>
            <p className="mt-4 text-sm font-light leading-relaxed text-gray-500">
              Una plataforma pensada para concesionarios que quieren construir
              presencia digital propia sin depender de nadie.
            </p>
            <ul className="mt-8 space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <PiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <span className="text-sm font-light text-gray-700">{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <a
                href="#planes"
                className="text-sm font-medium text-blue-600 underline-offset-4 hover:underline"
              >
                Ver qué incluye cada plan →
              </a>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-xl shadow-gray-100/80">
              <Image
                src="/mockups/web.png"
                alt="Sitio público del concesionario en motorflow"
                width={1344}
                height={588}
                sizes="(max-width: 1024px) 100vw, 512px"
                quality={90}
                className="w-full"
              />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
