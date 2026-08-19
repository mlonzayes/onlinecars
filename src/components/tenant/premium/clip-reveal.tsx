"use client";

import { useRef } from "react";
import {
  CLIP_HIDDEN,
  CLIP_VISIBLE,
  DEFAULT_START,
  REVEAL_DURATION,
  REVEAL_EASE,
  gsap,
  useIsomorphicLayoutEffect,
} from "@/lib/gsap";

interface ClipRevealProps {
  children: React.ReactNode;
  className?: string;
  // Retraso en segundos. Sirve para encadenar el reveal de la imagen y el del
  // texto sin armar una timeline con ScrollTrigger compartido.
  delay?: number;
}

/**
 * Descubre su contenido animando `clip-path` de abajo hacia arriba.
 *
 * Por qué clip-path y no un fade: el fade comunica "todavía no cargó", el clip
 * comunica "esto se está revelando". Es la diferencia entre un loader y una
 * puesta en escena, y cuesta lo mismo — clip-path se compone en GPU y no
 * dispara layout.
 *
 * El estado inicial se setea dentro de useIsomorphicLayoutEffect (que en
 * cliente es useLayoutEffect): corre ANTES del paint, así que no hay flash del
 * contenido visible antes de ocultarse.
 */
export function ClipReveal({ children, className, delay = 0 }: ClipRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          node,
          { clipPath: CLIP_HIDDEN },
          {
            clipPath: CLIP_VISIBLE,
            duration: REVEAL_DURATION,
            ease: REVEAL_EASE,
            delay,
            scrollTrigger: { trigger: node, start: DEFAULT_START, once: true },
          }
        );
      });

      // Sin animación: el contenido queda visible de entrada. NO alcanza con no
      // animar — hay que setear el clip explícito, porque el estado inicial lo
      // pone la rama de arriba si el usuario cambia la preferencia en caliente.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(node, { clipPath: CLIP_VISIBLE });
      });
    }, node);

    return () => ctx.revert();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
