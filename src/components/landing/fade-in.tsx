"use client";

import { useRef } from "react";
import { useRevealOnScroll } from "@/hooks/use-reveal-on-scroll";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  /** Si true, anima cada hijo directo con stagger */
  stagger?: boolean;
}

const STAGGER_SECONDS = 0.07;

function getDirectChildren(node: HTMLElement): HTMLElement[] {
  return Array.from(node.children) as HTMLElement[];
}

/**
 * Fade + Y al entrar al viewport. `"use client"` limitado a este componente —
 * las secciones padre quedan como Server Components.
 *
 * Sin GSAP: IntersectionObserver + CSS (ver useRevealOnScroll), igual que el
 * sitio del tenant. Cada ScrollTrigger medía el layout al montar (~15 en la
 * landing) y GSAP sumaba ~40 KB de JS a la web principal.
 */
export function FadeIn({ children, className, stagger = false }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);

  useRevealOnScroll(ref, {
    stagger: stagger ? STAGGER_SECONDS : 0,
    getTargets: stagger ? getDirectChildren : undefined,
  });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
