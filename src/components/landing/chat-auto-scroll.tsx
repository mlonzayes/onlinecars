"use client";

import { useLayoutEffect, useRef } from "react";

const SCROLL_S = 0.45;
const EASE = "cubic-bezier(0.2, 0.7, 0.2, 1)";

interface ChatAutoScrollProps {
  children: React.ReactNode;
}

/**
 * Hace que la conversación del hero suba como un chat real: cada mensaje nuevo
 * aparece abajo y empuja a los anteriores hacia arriba.
 *
 * Solo `transform` sobre el contenedor (Web Animations API), nunca alto ni
 * margin: mover los mensajes por layout contaría como layout shift (CLS) en
 * PageSpeed. Los tiempos salen del `animation-delay` de cada mensaje (`.chat-in`)
 * y la animación arranca sincronizada con esas animaciones CSS.
 *
 * Sin JS o con reduced-motion queda la conversación completa, como antes.
 */
export function ChatAutoScroll({ children }: ChatAutoScrollProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || typeof track.animate !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const items = Array.from(track.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement
    );
    if (items.length < 2) return;

    // Cuánto bajar el track para que el mensaje k quede apoyado abajo de todo.
    const height = track.offsetHeight;
    const offsetFor = (el: HTMLElement) => Math.max(0, height - (el.offsetTop + el.offsetHeight));
    const delayOf = (el: HTMLElement) => parseFloat(getComputedStyle(el).animationDelay) || 0;

    const steps = items.map((el) => ({ at: delayOf(el), y: offsetFor(el) }));
    const total = steps[steps.length - 1].at + SCROLL_S;

    // Si dos mensajes llegan más rápido que el scroll (3s y 3.4s), el tramo
    // siguiente arranca donde terminó el anterior: los offsets de WAAPI tienen
    // que ser no decrecientes o `animate()` tira.
    const keyframes: Keyframe[] = [{ offset: 0, transform: `translateY(${steps[0].y}px)` }];
    let prevEnd = 0;
    for (let k = 1; k < steps.length; k++) {
      const start = Math.min(Math.max(steps[k].at / total, prevEnd), 1);
      const end = Math.min(Math.max((steps[k].at + SCROLL_S) / total, start), 1);
      keyframes.push({ offset: start, transform: `translateY(${steps[k - 1].y}px)`, easing: EASE });
      keyframes.push({ offset: end, transform: `translateY(${steps[k].y}px)` });
      prevEnd = end;
    }

    let animation: Animation;
    try {
      animation = track.animate(keyframes, { duration: total * 1000, fill: "both" });
    } catch {
      return; // Decorativo: si falla, queda la conversación completa.
    }
    // Mismo reloj que las animaciones CSS de los mensajes (arrancaron antes de hidratar).
    const cssStart = items[0].getAnimations()[0]?.startTime;
    if (typeof cssStart === "number") animation.startTime = cssStart;

    return () => animation.cancel();
  }, []);

  return (
    <div ref={trackRef} className="relative flex flex-col gap-2">
      {children}
    </div>
  );
}
