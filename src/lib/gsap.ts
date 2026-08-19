import { useEffect, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Registro idempotente: solo en cliente. gsap.registerPlugin es safe de llamar
// varias veces (interno chequea duplicados), pero igual lo gateamos a una sola
// inicializacion para evitar trabajo extra en HMR.
let scrollTriggerRegistered = false;
if (typeof window !== "undefined" && !scrollTriggerRegistered) {
  gsap.registerPlugin(ScrollTrigger);
  scrollTriggerRegistered = true;
}

// Tokens compartidos de animación: cualquier cambio de timing/easing se hace acá.
export const DURATION = 0.45 as const;
export const EASE = "power2.out" as const;
export const Y_OFFSET = 16 as const;
export const DEFAULT_START = "top 85%" as const;

/* Tokens del template "prestige".
   Son más lentos y con más desaceleración que los default a propósito: un fade
   de 0.45s lee como "interfaz", uno de 1.1s con power3 lee como "editorial".
   El costo de cómputo es el mismo — lo único que cambia es la percepción. */
export const REVEAL_DURATION = 1.1 as const;
export const REVEAL_EASE = "power3.out" as const;

/* Reveal por clip-path en vez de opacity. La imagen se "descubre" de abajo
   hacia arriba en lugar de aparecer, que es lo que hace que se lea caro.
   Anima solo clip-path (compositable) — no toca layout. */
export const CLIP_HIDDEN = "inset(100% 0% 0% 0%)" as const;
export const CLIP_VISIBLE = "inset(0% 0% 0% 0%)" as const;

/* Parallax: cuánto se desplaza la imagen respecto del contenedor, en % de su
   propia altura. Con más de ~12 se empieza a ver el borde del contenedor si la
   imagen no tiene scale extra. */
export const PARALLAX_PERCENT = 10 as const;

// Breakpoint para gatear efectos pesados (pin, scrub). Debajo de esto los
// desactivamos: en mobile el pin pelea con la barra de URL del browser y el
// scroll queda con saltos.
export const DESKTOP_QUERY = "(min-width: 1024px)" as const;

// Query combinada: desktop Y sin preferencia de menos movimiento. La usan los
// bloques con scrub/pin, que son los que más molestan si el usuario pidió
// reducir movimiento.
export const DESKTOP_MOTION_QUERY =
  "(min-width: 1024px) and (prefers-reduced-motion: no-preference)" as const;

// useLayoutEffect en cliente para evitar el flash entre el estado inicial
// y el render del primer frame; useEffect en SSR para no romper Next.
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export { gsap, ScrollTrigger };
