"use client";

import { createElement, useRef } from "react";
import {
  DEFAULT_START,
  DURATION,
  EASE,
  Y_OFFSET,
  gsap,
  useIsomorphicLayoutEffect,
} from "@/lib/gsap";

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
  start?: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

// Wrapper generico para animar bloques al entrar al viewport.
// - "fadeUp": anima el wrapper como una unidad.
// - "stagger": anima los hijos directos (uno detras de otro).
// Respeta prefers-reduced-motion via gsap.matchMedia y limpia con ctx.revert().
export function AnimateOnScroll({
  children,
  preset = "fadeUp",
  staggerDelay = 0.06,
  start = DEFAULT_START,
  className,
  as = "div",
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (preset === "fadeUp") {
          gsap.fromTo(
            node,
            { autoAlpha: 0, y: Y_OFFSET },
            {
              autoAlpha: 1,
              y: 0,
              duration: DURATION,
              ease: EASE,
              scrollTrigger: {
                trigger: node,
                start,
                once: true,
              },
            }
          );
        } else {
          // stagger: animamos los items reales. Si el unico hijo directo es un
          // wrapper (ej: CategoriesGrid renderiza un <div className="grid">),
          // entramos un nivel para alcanzar las cards.
          const targets = resolveStaggerTargets(node);
          if (targets.length === 0) return;
          gsap.set(targets, { autoAlpha: 0, y: Y_OFFSET });
          gsap.to(targets, {
            autoAlpha: 1,
            y: 0,
            duration: DURATION,
            ease: EASE,
            stagger: staggerDelay,
            scrollTrigger: {
              trigger: node,
              start,
              once: true,
            },
          });
        }
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        if (preset === "fadeUp") {
          gsap.set(node, { autoAlpha: 1, y: 0 });
        } else {
          const targets = resolveStaggerTargets(node);
          gsap.set(targets, { autoAlpha: 1, y: 0 });
        }
      });
    }, node);

    return () => ctx.revert();
  }, [preset, staggerDelay, start]);

  return createElement(
    as,
    { ref, className } as React.HTMLAttributes<HTMLElement> & {
      ref: React.RefObject<HTMLElement | null>;
    },
    children
  );
}
