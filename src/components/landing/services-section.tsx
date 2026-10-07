"use client";

import {
  PiPackage,
  PiGlobe,
  PiPlug,
  PiCalculator,
  PiBank,
  PiMagicWand,
  PiLightning,
} from "react-icons/pi";
import { FadeIn } from "./fade-in";
import { RoadmapTimeline } from "./roadmap-timeline";
import { type RoadmapItemProps } from "./roadmap-item";

// Esta sección vive en client porque pasa los componentes de icono (funciones)
// a <RoadmapTimeline> (también client). Funciones no son serializables a través
// del boundary Server→Client, así que el array tiene que estar en el lado client.
const SERVICES: RoadmapItemProps[] = [
  {
    icon: PiPackage,
    title: "Gestión de inventario",
    description:
      "Cargá, editá y publicá tu stock en minutos. Estados, fotos y datos legales sin hojas de cálculo.",
  },
  {
    icon: PiGlobe,
    title: "Página web propia",
    description:
      "Tu catálogo en un dominio personalizado, con tu branding. Profesional desde el día uno.",
  },
  {
    icon: PiPlug,
    title: "Integraciones",
    description:
      "Conectá MercadoLibre y otros canales. Publicá una vez, aparecé en todos lados.",
    highlighted: true,
  },
  {
    icon: PiCalculator,
    title: "Tasación de vehículos",
    description:
      "Asistente de tasación para acelerar la cotización de usados que recibís en parte de pago.",
    comingSoon: true,
  },
  {
    icon: PiLightning,
    title: "Automatizaciones",
    description:
      "Mensajes automáticos al lead, recordatorios de seguimiento, envío de documentación.",
    comingSoon: true,
  },
  {
    icon: PiBank,
    title: "Bancos y financiación",
    description:
      "Cotizá planes de financiación con bancos integrados desde la ficha del auto.",
    comingSoon: true,
  },
  {
    icon: PiMagicWand,
    title: "Soluciones a medida",
    description:
      "Para concesionarios grandes: integraciones custom, importadores, reportes.",
    comingSoon: true,
  },
];

export function ServicesSection() {
  return (
    <section id="servicios" className="relative overflow-hidden bg-gray-50 px-4 py-14 sm:py-16">
      {/* Orbes decorativos con los glows CSS del hero (antes FloatingOrbs con
          GSAP). Solo transform, y solo animan desde sm (ver globals.css). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="hero-glow absolute left-[75%] top-[5%] h-80 w-80 rounded-full bg-blue-200/25 blur-3xl" />
        <div
          className="hero-glow-alt absolute left-[5%] top-[70%] h-64 w-64 rounded-full bg-indigo-200/20 blur-3xl"
          style={{ animationDelay: "-4s" }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl">
        <FadeIn className="text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
            Lo que ya tenés y lo que se viene
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500 sm:text-base">
            Todo lo que podés hacer hoy con motorflow, y las funciones nuevas
            que estamos sumando para los próximos meses.
          </p>
        </FadeIn>

        <RoadmapTimeline items={SERVICES} />
      </div>
    </section>
  );
}
