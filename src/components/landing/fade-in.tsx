"use client";

import { useRef } from "react";
import { useRevealOnScroll } from "@/hooks/use-reveal-on-scroll";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Si true, anima cada hijo directo con stagger */
  stagger?: boolean;
}

const STAGGER_S = 0.07;

// Fuera del componente: useRevealOnScroll la tiene en sus deps.
const directChildren = (node: HTMLElement) =>
  Array.from(node.children).filter((el): el is HTMLElement => el instanceof HTMLElement);

/**
 * Wrapper liviano que aplica fade + Y al entrar al viewport.
 * `"use client"` limitado a este componente — las secciones padre quedan como Server Components.
 *
 * Sin GSAP a propósito (IntersectionObserver + CSS, ver useRevealOnScroll):
 * GSAP + ScrollTrigger eran ~40 KB en el bundle inicial de la landing y cada
 * trigger mide layout al montar. Mismo cambio que ya se hizo en el sitio del tenant.
 */
export function FadeIn({ children, className, delay = 0, stagger = false }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);

  useRevealOnScroll(ref, {
    delay,
    stagger: stagger ? STAGGER_S : 0,
    getTargets: stagger ? directChildren : undefined,
  });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
