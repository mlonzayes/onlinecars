"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  PiFlag,
  PiFunnel,
  PiDatabase,
  PiHandCoins,
  PiTimer,
  PiArrowsClockwise,
} from "react-icons/pi";
import { FadeIn } from "./fade-in";

gsap.registerPlugin(ScrollTrigger);

// El primer item es el "featured" (celda grande del bento). El resto son celdas chicas.
const FEATURED = {
  Icon: PiFlag,
  title: "Tu marca, tu sitio propio",
  description:
    "Dejás de ser un perfil más en los portales. Tenés tu URL, tu logo y tus colores. Tus clientes te encuentran a vos, no a la competencia que paga más publicidad.",
};

const BENEFITS = [
  {
    Icon: PiFunnel,
    title: "Leads directos",
    description: "Las consultas llegan a vos, no al portal. Sin pagar por cada contacto.",
  },
  {
    Icon: PiDatabase,
    title: "Stock centralizado",
    description: "Un solo lugar para todo tu inventario. Actualizás en segundos.",
  },
  {
    Icon: PiHandCoins,
    title: "Sin comisiones",
    description: "Suscripción mensual fija. Lo que vendés es 100% tuyo.",
  },
  {
    Icon: PiTimer,
    title: "Listo en el día",
    description: "Onboarding guiado, sin técnicos. En horas tenés el sitio con tu stock.",
  },
  {
    Icon: PiArrowsClockwise,
    title: "Siempre actualizado",
    description: "Precio, fotos y estado en tiempo real, en tu sitio y en MercadoLibre.",
  },
];

export function BenefitsSection() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const cells = Array.from(grid.children);

    // Si el usuario pidió menos movimiento, mostramos todo sin animar
    // (las celdas arrancan en opacity-0 para evitar el flash inicial).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(cells, { opacity: 1, clearProps: "transform" });
      return;
    }

    const ctx = gsap.context(() => {
      cells.forEach((cell) => {
        // Cada celda tiene su propio trigger: fade + escala + slide cuando entra al viewport.
        gsap.fromTo(
          cell,
          { opacity: 0, y: 48, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.75,
            ease: "power3.out",
            // Al terminar limpiamos el transform inline para que el hover (CSS) funcione.
            onComplete: () => gsap.set(cell, { clearProps: "transform" }),
            scrollTrigger: {
              trigger: cell,
              start: "top 90%",
              once: true,
            },
          }
        );
      });
    }, grid);

    return () => ctx.revert();
  }, []);

  return (
    <section className="bg-white px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-600">
            Beneficios
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-gray-900 sm:text-3xl">
            Todo lo que necesitás para vender más
          </h2>
        </FadeIn>

        <div
          ref={gridRef}
          className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:auto-rows-[210px] lg:grid-cols-3"
        >
          {/* Celda destacada — gradiente azul, ocupa 2x2 en desktop */}
          <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-7 opacity-0 sm:col-span-2 lg:row-span-2">
            <div
              aria-hidden
              className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl transition-transform duration-700 group-hover:scale-150"
            />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <FEATURED.Icon className="h-6 w-6 text-white" />
            </div>
            <div className="relative">
              <h3 className="text-xl font-semibold text-white sm:text-2xl">
                {FEATURED.title}
              </h3>
              <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-blue-50/90">
                {FEATURED.description}
              </p>
            </div>
          </article>

          {/* Celdas chicas — fondo con gradiente sutil, no plano */}
          {BENEFITS.map(({ Icon, title, description }) => (
            <article
              key={title}
              className="group flex flex-col rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-blue-50/50 p-6 opacity-0 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100/70 transition-colors group-hover:bg-blue-600">
                <Icon className="h-5 w-5 text-blue-600 transition-colors group-hover:text-white" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-gray-900">{title}</h3>
              <p className="mt-1.5 text-sm font-light leading-relaxed text-gray-500">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
