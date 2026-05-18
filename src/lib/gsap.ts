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

// useLayoutEffect en cliente para evitar el flash entre el estado inicial
// y el render del primer frame; useEffect en SSR para no romper Next.
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export { gsap, ScrollTrigger };
