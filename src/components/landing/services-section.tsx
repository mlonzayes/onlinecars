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
import { ScrollReveal } from "./scroll-reveal";
import { TextReveal } from "./text-reveal";
import { FloatingOrbs } from "./floating-orbs";
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
      <FloatingOrbs
        orbs={[
          { top: "5%", left: "75%", size: 320, color: "bg-blue-200/25", duration: 20 },
          { top: "70%", left: "5%", size: 260, color: "bg-indigo-200/20", duration: 24, delay: 2 },
        ]}
      />

      <div className="relative mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
            <TextReveal stagger={0.04}>Lo que ya tenés y lo que se viene</TextReveal>
          </h2>
          <ScrollReveal y={15} blur={3} delay={0.2}>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500 sm:text-base">
              Todo lo que podés hacer hoy con motorflow, y las funciones nuevas
              que estamos sumando para los próximos meses.
            </p>
          </ScrollReveal>
        </div>

        <RoadmapTimeline items={SERVICES} />
      </div>
    </section>
  );
}
