"use client";

import { createElement, useRef } from "react";
import { useRevealOnScroll } from "@/hooks/use-reveal-on-scroll";

type AnimatePreset = "fadeUp" | "stagger";

// Resuelve los items a animar en preset "stagger". Si los hijos directos del
// wrapper son varios, los anima directo. Si hay un unico hijo wrapper, entra
// un nivel mas. Esto cubre el caso de componentes hijos que renderizan su
// propio <div className="grid"> (CategoriesGrid, BrandsGrid, etc.).
function resolveStaggerTargets(node: HTMLElement): HTMLElement[] {
  const direct = Array.from(node.children) as HTMLElement[];
  if (direct.length === 0) return [];
  if (direct.length === 1) {
    const inner = Array.from(direct[0].children) as HTMLElement[];
    if (inner.length > 1) return inner;
  }
  return direct;
}

interface AnimateOnScrollProps {
  children: React.ReactNode;
  preset?: AnimatePreset;
  staggerDelay?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

// Wrapper generico para animar bloques al entrar al viewport.
// - "fadeUp": anima el wrapper como una unidad.
// - "stagger": anima los hijos directos (uno detras de otro).
// Sin GSAP: IntersectionObserver + CSS (ver useRevealOnScroll).
export function AnimateOnScroll({
  children,
  preset = "fadeUp",
  staggerDelay = 0.06,
  className,
  as = "div",
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLElement | null>(null);

  useRevealOnScroll(ref, {
    stagger: preset === "stagger" ? staggerDelay : 0,
    getTargets: preset === "stagger" ? resolveStaggerTargets : undefined,
  });

  return createElement(
    as,
    { ref, className } as React.HTMLAttributes<HTMLElement> & {
      ref: React.RefObject<HTMLElement | null>;
    },
    children
  );
}
