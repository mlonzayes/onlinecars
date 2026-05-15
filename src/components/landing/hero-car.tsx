"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";

export function HeroCar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const wrapper = wrapperRef.current;
    if (!container || !wrapper) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      // Entrada inicial: fade + scale. Sin loops continuos después.
      gsap.set(wrapper, { opacity: 0, y: 30, scale: 0.96 });
      gsap.to(wrapper, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.2,
        ease: "power3.out",
        force3D: true,
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative aspect-[4/3] w-full">
      {/* Mask gradient: opaco arriba (cabezas/torso) → transparente abajo (piernas).
          Hace que la imagen "se mimetice" con el fondo y el corte sea sutil.
          Si querés ajustar dónde empieza el fade, cambiá el primer % (más alto =
          más imagen visible antes del fade). */}
      <div
        ref={wrapperRef}
        className="relative h-full w-full"
        style={{
          willChange: "transform, opacity",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 85%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 85%, transparent 100%)",
        }}
      >
        <Image
          src="/hero.png"
          alt="Equipo del concesionario entregando un auto"
          fill
          priority
          quality={95}
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="object-contain"
        />
      </div>
    </div>
  );
}
