"use client";

import Image from "next/image";
import { ScrollReveal } from "./scroll-reveal";
import { TextReveal } from "./text-reveal";
import { FloatingOrbs } from "./floating-orbs";

interface Step {
  number: string;
  title: string;
  description: string;
  /** Mockup/screenshot opcional al pie de la card (ruta a /public/...).
   *  Si no se pasa, la card queda solo con número + texto. */
  image?: string;
}

const STEPS: Step[] = [
  {
    number: "01",
    title: "Anotá tu concesionario",
    description:
      "Creás tu cuenta en minutos con tu CUIT y datos de contacto. Sin tarjeta, sin permanencia.",
    image: "/mockups/signup_mockup_1778627432515.png",
  },
  {
    number: "02",
    title: "Cargá tu stock",
    description:
      "Subís fotos, datos legales y precios desde un panel pensado para no-técnicos. Estados y reordenamiento sin Excel.",
    image: "/mockups/inventory_mockup_1778627453032.png",
  },
  {
    number: "03",
    title: "Activá tu sitio",
    description:
      "En un click tu catálogo está online en tu propio dominio, con tu marca y theme. Listo para recibir visitas.",
    image: "/mockups/website_mockup_1778627472208.png",
  },
  {
    number: "04",
    title: "Recibí mensajes",
    description:
      "Las consultas entran a tu panel, las gestionás con seguimiento y cerrás ventas sin perder oportunidades.",
    image: "/mockups/leads_mockup_1778627492084.png",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="como-funciona"
      className="relative overflow-hidden bg-white px-4 py-14 sm:py-16"
    >
      <FloatingOrbs
        orbs={[
          { top: "5%", left: "8%", size: 280, color: "bg-blue-200/20", duration: 22 },
          { top: "60%", left: "82%", size: 240, color: "bg-cyan-200/20", duration: 18, delay: 1.5 },
        ]}
      />

      <div className="relative mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
            <TextReveal stagger={0.04}>Cómo funciona</TextReveal>
          </h2>
          <ScrollReveal y={15} blur={3} delay={0.2}>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500 sm:text-base">
              De la registración a las primeras consultas en menos de una hora.
              Sin instalaciones ni configuraciones complejas.
            </p>
          </ScrollReveal>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((step, i) => {
            const directions = [
              { x: -30, y: 20 },
              { x: 30, y: 20 },
              { x: -30, y: -10 },
              { x: 30, y: -10 },
            ];
            const dir = directions[i] ?? { x: 0, y: 20 };

            return (
              <div key={step.number} className="relative">
                <ScrollReveal
                  x={dir.x}
                  y={dir.y}
                  scale={0.96}
                  duration={0.75}
                  delay={i * 0.08}
                  ease="back.out(1.3)"
                  className="h-full"
                >
                  <div className="group relative flex h-full flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50 sm:p-6">
                    {/* Header: número grande + título + descripción */}
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <span className="block shrink-0 text-4xl font-extrabold leading-none text-gray-200 transition-colors group-hover:text-blue-100 sm:text-5xl">
                          {step.number}
                        </span>

                        <div className="flex-1">
                          <h3 className="text-base font-bold text-gray-900 sm:text-lg leading-tight">
                            {step.title}
                          </h3>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-500">
                        {step.description}
                      </p>
                    </div>

                    {/* Mockup/screenshot opcional al pie de la card */}
                    {step.image && (
                      <div className="mt-auto overflow-hidden rounded-xl border border-gray-100 bg-gray-50 shadow-sm transition-transform duration-500 group-hover:scale-[1.02]">
                        <div className="relative aspect-[4/3] w-full">
                          <Image
                            src={step.image}
                            alt={step.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className="object-cover object-top"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollReveal>

                {/* Flecha conectora (solo visible en pantallas lg) */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-4 z-10 -translate-y-1/2 translate-x-1/2 items-center justify-center h-10 w-10 rounded-full bg-white border border-gray-200 shadow-md text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path fill="currentColor" d="M221.66 133.66l-72 72a8 8 0 0 1-11.32-11.32L196.69 136H40a8 8 0 0 1 0-16h156.69l-58.35-58.34a8 8 0 0 1 11.32-11.32l72 72a8 8 0 0 1 0 11.32Z"/></svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
