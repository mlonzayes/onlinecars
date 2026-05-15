"use client";

import { useLayoutEffect, useRef, Children, isValidElement, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface TextRevealProps {
  /** El contenido — puede ser string o un node con spans dentro */
  children: ReactNode;
  /** Stagger entre palabras en segundos. Default: 0.05 */
  stagger?: number;
  /** Delay inicial */
  delay?: number;
  /** Si dispara con scroll trigger (true) o solo on mount (false). Default: true */
  onScroll?: boolean;
  className?: string;
}

// Renderiza como <span> inline-block para poder usarse dentro de <h1>/<h2>
// sin romper la semántica HTML. Las palabras hacen wrap natural.

// Revela texto palabra por palabra con stagger. Acepta:
// - string plano: lo splitea por espacios y envuelve cada palabra en span
// - JSX con spans/elementos hijos: usa esos hijos directos como targets
//
// Para preservar layout en wrap natural, cada span se renderiza inline-block
// con un margen pequeño a la derecha que actúa como espacio.
export function TextReveal({
  children,
  stagger = 0.05,
  delay = 0,
  onScroll = true,
  className,
}: TextRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = el.querySelectorAll("[data-word]");
    if (targets.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.set(targets, { opacity: 0, y: 24, rotateX: -40 });
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.7,
        delay,
        stagger,
        ease: "back.out(1.4)",
        scrollTrigger: onScroll
          ? {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none none",
            }
          : undefined,
      });
    }, el);

    return () => ctx.revert();
  }, [stagger, delay, onScroll]);

  // Si es string, splitear por palabras
  const content =
    typeof children === "string"
      ? splitWords(children)
      : renderChildrenWithWords(children);

  return (
    <span
      ref={ref}
      className={className}
      style={{ perspective: "800px", display: "inline-block" }}
    >
      {content}
    </span>
  );
}

function splitWords(text: string): ReactNode {
  return text.split(/(\s+)/).map((chunk, i) => {
    if (/^\s+$/.test(chunk)) return chunk;
    return (
      <span
        key={i}
        data-word
        style={{ display: "inline-block", transformOrigin: "0% 50%" }}
      >
        {chunk}
      </span>
    );
  });
}

// Si los hijos ya son spans/elementos JSX, los marcamos con data-word.
// Si hay strings entre medio (ej: <h1>Tu auto, <span>online</span></h1>),
// los splitea por palabras también.
function renderChildrenWithWords(children: ReactNode): ReactNode {
  return Children.map(children, (child, i) => {
    if (typeof child === "string") {
      return <span key={i}>{splitWords(child)}</span>;
    }
    if (isValidElement(child)) {
      return (
        <span
          key={i}
          data-word
          style={{ display: "inline-block", transformOrigin: "0% 50%" }}
        >
          {child}
        </span>
      );
    }
    return child;
  });
}
