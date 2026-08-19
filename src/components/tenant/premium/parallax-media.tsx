"use client";

import Image from "next/image";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import {
  DESKTOP_MOTION_QUERY,
  PARALLAX_PERCENT,
  gsap,
  useIsomorphicLayoutEffect,
} from "@/lib/gsap";

interface ParallaxMediaProps {
  src: string;
  alt: string;
  // Clases del CONTENEDOR (aspect ratio, alto, redondeo). La imagen siempre va
  // absolute adentro, así que acá va la geometría del bloque.
  className?: string;
  sizes: string;
  priority?: boolean;
}

/**
 * Imagen con parallax vertical atado al scroll.
 *
 * La capa interna sobresale un 12% arriba y abajo del contenedor y se desplaza
 * ±10% (PARALLAX_PERCENT). Ese margen de 2 puntos es lo que evita que el
 * desplazamiento descubra el borde del contenedor — si algún día se sube
 * PARALLAX_PERCENT hay que subir también el inset de acá.
 *
 * Gateado a desktop con `DESKTOP_MOTION_QUERY`: en mobile el scrub pelea con
 * el colapso de la barra de URL del browser (dispara resize y el scroll queda
 * con saltos), y encima es donde menos se aprecia el efecto.
 */
export function ParallaxMedia({
  src,
  alt,
  className,
  sizes,
  priority = false,
}: ParallaxMediaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    const layer = layerRef.current;
    if (!container || !layer) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(DESKTOP_MOTION_QUERY, () => {
        gsap.fromTo(
          layer,
          { yPercent: -PARALLAX_PERCENT },
          {
            yPercent: PARALLAX_PERCENT,
            // ease "none" es obligatorio con scrub: cualquier otro easing hace
            // que la imagen no siga el dedo de forma lineal y se siente elástico.
            ease: "none",
            scrollTrigger: {
              trigger: container,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      <div ref={layerRef} className="absolute inset-x-0 -inset-y-[12%]">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={sizes}
          priority={priority}
        />
      </div>
    </div>
  );
}
