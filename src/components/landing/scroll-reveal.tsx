"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollRevealProps {
  children: React.ReactNode;
  /** Píxeles de offset inicial (slide). Default: 30 */
  y?: number;
  /** Demora antes de empezar la animación, en segundos */
  delay?: number;
  /** Duración de la animación, en segundos. Default: 0.8 */
  duration?: number;
  /** Si los hijos directos deben revelarse uno tras otro */
  stagger?: boolean;
  /** Selector CSS de los hijos a aplicar stagger (default: hijos directos) */
  staggerSelector?: string;
  /** Stagger gap entre items, en segundos. Default: 0.1 */
  staggerGap?: number;
  className?: string;
}

// Wrapper genérico que aplica fade-in + slide-up cuando entra al viewport.
// Usa useLayoutEffect para setear el estado inicial antes del paint y evitar
// el flash. Si JS está deshabilitado, el contenido se ve por defecto (no se
// aplica el opacity:0 inicial), preservando accesibilidad básica.
//
// Internamente usa gsap.context para que el cleanup revierta todos los
// scrollTriggers creados acá cuando el componente se desmonta.
export function ScrollReveal({
  children,
  y = 30,
  delay = 0,
  duration = 0.8,
  stagger = false,
  staggerSelector,
  staggerGap = 0.1,
  className,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respetar prefers-reduced-motion: si el user pidió menos animaciones,
    // mostramos el contenido sin animar.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = gsap.context(() => {
      if (stagger) {
        const targets = staggerSelector
          ? el.querySelectorAll(staggerSelector)
          : el.children;
        gsap.set(targets, { opacity: 0, y });
        gsap.to(targets, {
          opacity: 1,
          y: 0,
          duration,
          delay,
          stagger: staggerGap,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      } else {
        gsap.set(el, { opacity: 0, y });
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration,
          delay,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }
    }, el);

    return () => ctx.revert();
  }, [y, delay, duration, stagger, staggerSelector, staggerGap]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
