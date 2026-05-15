"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

interface Orb {
  /** Posición inicial top en % del container */
  top: string;
  /** Posición inicial left en % del container */
  left: string;
  /** Tamaño en px */
  size: number;
  /** Clases tailwind del color (ej: "bg-blue-300/40") */
  color: string;
  /** Duración del loop en segundos */
  duration: number;
  /** Delay inicial */
  delay?: number;
}

interface FloatingOrbsProps {
  orbs?: Orb[];
  className?: string;
}

const DEFAULT_ORBS: Orb[] = [
  { top: "10%", left: "5%", size: 380, color: "bg-blue-300/30", duration: 14 },
  { top: "60%", left: "75%", size: 300, color: "bg-blue-400/25", duration: 18, delay: 2 },
  { top: "30%", left: "85%", size: 220, color: "bg-indigo-300/20", duration: 16, delay: 1 },
];

// Orbs con gradient blur que flotan en patrones sinusoidales independientes.
// Optimizaciones:
// - blur-2xl en lugar de blur-3xl (~40% menos costo de GPU sin perder visual)
// - will-change + force3D para que el browser los promueva a compositor layer
// - IntersectionObserver pausa los tweens cuando el container no está en viewport
//   (cero costo cuando estás scrolleando otra parte de la página)
export function FloatingOrbs({ orbs = DEFAULT_ORBS, className = "" }: FloatingOrbsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const tweens: gsap.core.Tween[] = [];

    const ctx = gsap.context(() => {
      const orbElements = container.querySelectorAll("[data-orb]");
      orbElements.forEach((orb, i) => {
        const config = orbs[i];
        if (!config) return;

        tweens.push(
          gsap.to(orb, {
            x: gsap.utils.random(-60, 60),
            y: gsap.utils.random(-40, 40),
            duration: config.duration,
            delay: config.delay ?? 0,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            force3D: true,
          }),
          gsap.to(orb, {
            x: gsap.utils.random(-80, 80),
            duration: config.duration * 1.3,
            delay: (config.delay ?? 0) + 0.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            force3D: true,
          })
        );
      });
    }, container);

    // Pausar tweens cuando la sección no está visible
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? true;
        tweens.forEach((t) => (visible ? t.resume() : t.pause()));
      },
      { rootMargin: "100px" }
    );
    io.observe(container);

    return () => {
      io.disconnect();
      ctx.revert();
    };
  }, [orbs]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {orbs.map((orb, i) => (
        <div
          key={i}
          data-orb
          className={`absolute rounded-full blur-2xl ${orb.color}`}
          style={{
            top: orb.top,
            left: orb.left,
            width: orb.size,
            height: orb.size,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
}
