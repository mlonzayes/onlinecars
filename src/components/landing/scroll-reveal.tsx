"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollRevealProps {
  children: React.ReactNode;
  /** Píxeles de offset inicial vertical (slide). Default: 30 */
  y?: number;
  /** Píxeles de offset inicial horizontal (slide desde el costado). Default: 0 */
  x?: number;
  /** Scale inicial (0.95 = entra ligeramente más chica). Default: 1 (sin scale) */
  scale?: number;
  /** Rotación inicial en grados. Default: 0 */
  rotate?: number;
  /** Blur inicial en pixels. Default: 0 */
  blur?: number;
  /** Demora antes de empezar la animación, en segundos */
  delay?: number;
  /** Duración de la animación, en segundos. Default: 0.8 */
  duration?: number;
  /** Easing function de gsap. Default: "power2.out" */
  ease?: string;
  /** Si los hijos directos deben revelarse uno tras otro */
  stagger?: boolean;
  /** Selector CSS de los hijos a aplicar stagger (default: hijos directos) */
  staggerSelector?: string;
  /** Stagger gap entre items, en segundos. Default: 0.1 */
  staggerGap?: number;
  className?: string;
}

export function ScrollReveal({
  children,
  y = 30,
  x = 0,
  scale = 1,
  rotate = 0,
  blur = 0,
  delay = 0,
  duration = 0.8,
  ease = "power2.out",
  stagger = false,
  staggerSelector,
  staggerGap = 0.1,
  className,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const fromVars: gsap.TweenVars = { opacity: 0, x, y, scale, rotate };
    if (blur > 0) fromVars.filter = `blur(${blur}px)`;

    const toVars: gsap.TweenVars = {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      rotate: 0,
      duration,
      delay,
      ease,
      force3D: true,
    };
    if (blur > 0) toVars.filter = "blur(0px)";

    const ctx = gsap.context(() => {
      if (stagger) {
        const targets = staggerSelector
          ? el.querySelectorAll(staggerSelector)
          : el.children;
        gsap.set(targets, fromVars);
        gsap.to(targets, {
          ...toVars,
          stagger: staggerGap,
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      } else {
        gsap.set(el, fromVars);
        gsap.to(el, {
          ...toVars,
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }
    }, el);

    return () => ctx.revert();
  }, [x, y, scale, rotate, blur, delay, duration, ease, stagger, staggerSelector, staggerGap]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
