"use client";

import { useEffect, type RefObject } from "react";

// Mismo timing que los tokens de lib/gsap.ts (DURATION / DEFAULT_START), para
// que la entrada se sienta igual que antes.
const REVEAL_DURATION_MS = 450;
const ROOT_MARGIN = "0px 0px -15% 0px";

interface RevealOptions {
  /** Delay entre items, en segundos. 0 = todos juntos. */
  stagger?: number;
  /** Delay antes del primer item, en segundos. */
  delay?: number;
  /** Resuelve los elementos a animar; por default, el nodo mismo. */
  getTargets?: (node: HTMLElement) => HTMLElement[];
}

/**
 * Fade-up al entrar al viewport con IntersectionObserver + transiciones CSS
 * (`.reveal-target` / `.reveal-pending` en globals.css).
 *
 * Reemplaza a GSAP + ScrollTrigger en el sitio del tenant: cada ScrollTrigger
 * mide el layout al montar, y con ~20 bloques animados eso eran cientos de ms
 * de "Style & Layout" en mobile, más ~40 KB de JS.
 *
 * Solo oculta lo que arranca FUERA del viewport (lo decide el primer callback
 * del observer, sin leer layout a mano). Lo que ya se ve no parpadea, y si el
 * JS no llega a correr el contenido queda visible: el server lo manda visible.
 */
export function useRevealOnScroll(
  ref: RefObject<HTMLElement | null>,
  { stagger = 0, delay = 0, getTargets }: RevealOptions = {}
) {
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = getTargets ? getTargets(node) : [node];
    if (targets.length === 0) return;

    let armed = false;
    let cleanupTimer: number | undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!armed) {
          armed = true;
          // Ya visible al montar: no se anima (evita el flash).
          if (entry.isIntersecting) {
            observer.disconnect();
            return;
          }
          targets.forEach((el, i) => {
            el.classList.add("reveal-target", "reveal-pending");
            el.style.transitionDelay = `${delay + i * stagger}s`;
          });
          return;
        }
        if (!entry.isIntersecting) return;
        observer.disconnect();
        targets.forEach((el) => el.classList.remove("reveal-pending"));
        // Al terminar, devolvemos el control de `transition` al componente
        // (ej: el hover de las cards tiene su propia transición).
        const total = REVEAL_DURATION_MS + (delay + targets.length * stagger) * 1000;
        cleanupTimer = window.setTimeout(() => {
          targets.forEach((el) => {
            el.classList.remove("reveal-target");
            el.style.transitionDelay = "";
          });
        }, total);
      },
      { rootMargin: ROOT_MARGIN }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      window.clearTimeout(cleanupTimer);
      targets.forEach((el) => {
        el.classList.remove("reveal-target", "reveal-pending");
        el.style.transitionDelay = "";
      });
    };
  }, [ref, stagger, delay, getTargets]);
}
