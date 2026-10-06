"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRevealOnScroll } from "@/hooks/use-reveal-on-scroll";

interface CarouselScrollerProps {
  /** Cada hijo es un item del carrusel (las cards vienen renderizadas del server). */
  children: React.ReactNode;
  itemCount: number;
  /** Lo que va a la derecha de los botones (ej: el link "Ver todo"). */
  trailing?: React.ReactNode;
  /** Intervalo de auto-advance en ms. 0 = desactivado. */
  autoAdvanceMs?: number;
}

// Con menos items entran todos en pantalla en desktop: sin botones ni autoplay.
const MIN_ITEMS_FOR_CAROUSEL_UX = 4;

function getItems(node: HTMLElement): HTMLElement[] {
  return Array.from(node.children) as HTMLElement[];
}

/**
 * La parte interactiva del carrusel: scroll snap, botones prev/next en desktop,
 * auto-advance con loop (pausa al hover/touch) y fade-up de las cards.
 * Las cards llegan como children ya renderizadas en el server: este componente
 * no las conoce, así que no viajan en el bundle de JS del cliente.
 */
export function CarouselScroller({
  children,
  itemCount,
  trailing,
  autoAdvanceMs = 4000,
}: CarouselScrollerProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const enableCarouselUX = itemCount >= MIN_ITEMS_FOR_CAROUSEL_UX;

  useRevealOnScroll(scrollerRef, { stagger: 0.06, getTargets: getItems });

  // Ancho de un "step" (card + gap) leído del DOM real, así sigue al CSS.
  function getStepWidth(scroller: HTMLElement): number {
    const first = scroller.firstElementChild as HTMLElement | null;
    if (!first) return 300;
    const styles = window.getComputedStyle(scroller);
    const gap = parseFloat(styles.columnGap || styles.gap || "16");
    return first.offsetWidth + gap;
  }

  function scrollNext() {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const step = getStepWidth(scroller);
    // Loop: cerca del final, volvemos al inicio.
    const nearEnd =
      scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - step / 2;
    if (nearEnd) {
      scroller.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      scroller.scrollBy({ left: step, behavior: "smooth" });
    }
  }

  function scrollPrev() {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const step = getStepWidth(scroller);
    // Loop en reversa: en el inicio, vamos al final.
    if (scroller.scrollLeft < 1) {
      scroller.scrollTo({ left: scroller.scrollWidth, behavior: "smooth" });
    } else {
      scroller.scrollBy({ left: -step, behavior: "smooth" });
    }
  }

  // Auto-advance. Pausa con hover/touch, tab oculto, reduce-motion o pocos items.
  useEffect(() => {
    if (autoAdvanceMs <= 0 || isPaused || !enableCarouselUX) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      scrollNext();
    }, autoAdvanceMs);

    return () => window.clearInterval(id);
    // scrollNext lee scrollerRef.current (DOM vivo), no captura estado viejo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAdvanceMs, isPaused, enableCarouselUX]);

  const buttonClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--tenant-border)] bg-[var(--tenant-surface)] text-[var(--tenant-fg)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--tenant-primary)] hover:text-[var(--tenant-primary)]";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        {enableCarouselUX ? (
          <div className="hidden items-center gap-2 md:flex">
            <button type="button" onClick={scrollPrev} aria-label="Anterior" className={buttonClass}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={scrollNext} aria-label="Siguiente" className={buttonClass}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <span aria-hidden />
        )}
        {trailing}
      </div>

      <div
        ref={scrollerRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}
