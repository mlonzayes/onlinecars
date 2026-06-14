"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { PiQuotes } from "react-icons/pi";
import { FadeIn } from "./fade-in";

const TESTIMONIALS = [
  {
    name: "Pablo M.",
    role: "Dueño · Automotores del Parque, Rosario",
    quote:
      "Antes perdía leads porque no tenía formulario propio. Ahora me llegan directo al mail y puedo hacer seguimiento desde el panel.",
  },
  {
    name: "Silvana T.",
    role: "Gerenta · Dos Ruedas SA, Buenos Aires",
    quote:
      "Subir el stock lleva minutos. El catálogo online mejoró nuestra imagen y los clientes llegan mejor informados.",
  },
  {
    name: "Rodrigo N.",
    role: "Socio · Norte Autos, Córdoba",
    quote:
      "La integración con MercadoLibre nos ahorró horas de carga duplicada por semana. Publicamos una vez y aparecemos en los dos lados.",
  },
  {
    name: "Carolina V.",
    role: "Directora · Premium Motors, Mendoza",
    quote:
      "Los clientes llegan preguntando por modelos específicos que vieron en el sitio. Antes, con solo MercadoLibre, eso no pasaba.",
  },
  {
    name: "Matías O.",
    role: "Vendedor · Central Usados, Tucumán",
    quote:
      "El panel de ventas con el legajo digital reemplazó cinco carpetas de papel. Todo el historial del cliente en un lugar.",
  },
  {
    name: "Graciela F.",
    role: "Propietaria · Autos Familia, La Plata",
    quote:
      "Pensé que iba a ser complicado. En un día ya tenía el sitio funcionando con mis fotos y mis precios.",
  },
];

export function TestimonialsSection() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Width of one full set of cards (half of total since we duplicate)
    const halfWidth = track.scrollWidth / 2;

    const tween = gsap.to(track, {
      x: -halfWidth,
      duration: 35,
      ease: "none",
      repeat: -1,
    });

    const container = track.parentElement!;
    const pause = () => tween.pause();
    const resume = () => tween.resume();
    container.addEventListener("mouseenter", pause);
    container.addEventListener("mouseleave", resume);

    return () => {
      tween.kill();
      container.removeEventListener("mouseenter", pause);
      container.removeEventListener("mouseleave", resume);
    };
  }, []);

  return (
    <section className="overflow-hidden bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <FadeIn className="text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-600">
            Testimonios
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-gray-900 sm:text-3xl">
            Lo que dicen los concesionarios
          </h2>
        </FadeIn>
      </div>

      {/* Carousel strip */}
      <div
        className="mt-12 overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      >
        <div
          ref={trackRef}
          className="flex gap-5 px-5"
          style={{ width: "max-content" }}
        >
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
            <div
              key={i}
              className="flex w-72 shrink-0 flex-col rounded-xl border border-gray-200 bg-gray-50 p-6"
            >
              <PiQuotes className="h-5 w-5 text-blue-200" />
              <p className="mt-3 flex-1 text-sm font-light leading-relaxed text-gray-600">
                {t.quote}
              </p>
              <div className="mt-5 border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-900">{t.name}</p>
                <p className="mt-0.5 text-xs font-light text-gray-400">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
