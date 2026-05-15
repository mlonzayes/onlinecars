"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";

interface TiltCardProps {
  children: ReactNode;
  /** Intensidad máxima de la rotación en grados. Default: 8 */
  maxTilt?: number;
  /** Si aplica un leve elevate (translateZ) al hover. Default: true */
  elevate?: boolean;
  className?: string;
}

// Wrapper que aplica tilt 3D al pasar el mouse, siguiendo la posición del cursor.
//
// Optimizaciones:
// - rAF throttle: pointermove dispara 60-120 veces/s; con rAF cacheamos las
//   últimas coords y disparamos un único tween por frame (60fps max).
// - will-change: transform para promover a compositor layer.
// - En touch (pointerType !== "mouse") se ignora — no rompe en mobile.
export function TiltCard({
  children,
  maxTilt = 8,
  elevate = true,
  className = "",
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastCoordsRef = useRef<{ x: number; y: number } | null>(null);

  function applyTilt() {
    rafRef.current = null;
    const el = ref.current;
    const coords = lastCoordsRef.current;
    if (!el || !coords) return;

    const rect = el.getBoundingClientRect();
    const px = (coords.x - rect.left) / rect.width;
    const py = (coords.y - rect.top) / rect.height;

    const rotateY = (px - 0.5) * 2 * maxTilt;
    const rotateX = (py - 0.5) * 2 * -maxTilt;

    gsap.to(el, {
      rotateX,
      rotateY,
      translateZ: elevate ? 6 : 0,
      duration: 0.4,
      ease: "power2.out",
      transformPerspective: 1000,
      force3D: true,
      overwrite: "auto",
    });
  }

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    lastCoordsRef.current = { x: e.clientX, y: e.clientY };

    // rAF throttle: si ya hay un frame pendiente, no encolamos otro.
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(applyTilt);
  }

  function handleLeave() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastCoordsRef.current = null;

    const el = ref.current;
    if (!el) return;
    gsap.to(el, {
      rotateX: 0,
      rotateY: 0,
      translateZ: 0,
      duration: 0.6,
      ease: "power2.out",
      force3D: true,
      overwrite: "auto",
    });
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={className}
      style={{
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
