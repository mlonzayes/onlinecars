"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { VehicleCard } from "./vehicle-card";
import {
  DEFAULT_START,
  DURATION,
  EASE,
  Y_OFFSET,
  gsap,
  useIsomorphicLayoutEffect,
} from "@/lib/gsap";

interface FeaturedVehicle {
  id: string;
  publicSlug: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: string;
  currency: string;
  kilometers: number | null;
  fuelType: string | null;
  transmission: string | null;
  bodyType: string | null;
  condition: string;
  featured?: boolean;
  images: { url: string; isPrimary?: boolean; alt?: string | null; id?: string }[];
}

interface FeaturedTabsProps {
  vehicles: FeaturedVehicle[];
  basePath: string;
  // Cantidad máxima de vehículos a mostrar.
  limit?: number;
  // Intervalo de auto-advance en ms. Default 4000ms (4s). 0 = desactivado.
  autoAdvanceMs?: number;
}

// Threshold visual: si hay menos de N items, no tiene sentido auto-rotar ni
// mostrar botones — ya entran todos en pantalla en desktop.
const MIN_ITEMS_FOR_CAROUSEL_UX = 4;

/**
 * Carrusel horizontal de vehículos destacados con:
 *  - Scroll snap horizontal
 *  - Botones prev/next visibles en desktop (md+)
 *  - Auto-advance cada `autoAdvanceMs` (pausa al hover/touch)
 *  - Loop infinito: al llegar al final vuelve al inicio
 *
 * Mantenemos el nombre del componente (FeaturedTabs) para no romper imports
 * del section-renderer; la implementación es nueva.
 */
export function FeaturedTabs({
  vehicles,
  basePath,
  limit = 8,
  autoAdvanceMs = 4000,
}: FeaturedTabsProps) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const visible = vehicles.slice(0, limit);
  const enableCarouselUX = visible.length >= MIN_ITEMS_FOR_CAROUSEL_UX;

  // GSAP fade-in inicial — corre una sola vez al entrar en viewport.
  useIsomorphicLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const carousel = scope.querySelector<HTMLElement>("[data-featured-carousel]");
        if (!carousel) return;
        const cards = Array.from(carousel.children) as HTMLElement[];
        if (cards.length === 0) return;
        gsap.set(cards, { autoAlpha: 0, y: Y_OFFSET });
        gsap.to(cards, {
          autoAlpha: 1,
          y: 0,
          duration: DURATION,
          ease: EASE,
          stagger: 0.06,
          scrollTrigger: { trigger: carousel, start: DEFAULT_START, once: true },
        });
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        const carousel = scope.querySelector<HTMLElement>("[data-featured-carousel]");
        if (!carousel) return;
        const cards = Array.from(carousel.children) as HTMLElement[];
        gsap.set(cards, { autoAlpha: 1, y: 0 });
      });
    }, scope);
    return () => ctx.revert();
  }, []);

  // Calcula el ancho de un "step" (card width + gap) leyendo del DOM real.
  // No hardcodeamos — si cambia el tamaño del card en CSS, esto se adapta.
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
    // Loop: si estamos cerca del final, volvemos al inicio.
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
    // Loop en reversa: si estamos en el inicio, vamos al final.
    if (scroller.scrollLeft < 1) {
      scroller.scrollTo({ left: scroller.scrollWidth, behavior: "smooth" });
    } else {
      scroller.scrollBy({ left: -step, behavior: "smooth" });
    }
  }

  // Auto-advance. Pausa si:
  //  - El usuario hizo hover/touch (isPaused)
  //  - El tab está oculto (document.visibilityState !== "visible")
  //  - prefers-reduced-motion (respetamos accesibilidad)
  //  - El listado es chico (no aporta valor)
  useEffect(() => {
    if (autoAdvanceMs <= 0 || isPaused || !enableCarouselUX) return;
    const prefersReduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduce) return;

    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      scrollNext();
    }, autoAdvanceMs);

    return () => window.clearInterval(id);
    // scrollNext usa scrollerRef.current (live DOM) — no captura stale state,
    // por eso podemos excluirlo de deps sin riesgo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAdvanceMs, isPaused, enableCarouselUX]);

  if (visible.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--tenant-border-strong)] bg-[var(--tenant-surface)] py-12 text-center text-sm text-[var(--tenant-fg-muted)]">
        Sin vehículos destacados todavía.
      </p>
    );
  }

  return (
    <div ref={scopeRef}>
      <div className="mb-6 flex items-center justify-between gap-3 sm:mb-8">
        {/* Botones prev/next — visibles solo en desktop y si hay items suficientes */}
        {enableCarouselUX ? (
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={scrollPrev}
              aria-label="Anterior"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--tenant-border)] bg-[var(--tenant-surface)] text-[var(--tenant-fg)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--tenant-primary)] hover:text-[var(--tenant-primary)]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Siguiente"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--tenant-border)] bg-[var(--tenant-surface)] text-[var(--tenant-fg)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--tenant-primary)] hover:text-[var(--tenant-primary)]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <span aria-hidden />
        )}

        <Link
          href={`${basePath}/catalogo`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--tenant-primary)] hover:underline"
        >
          Ver todo
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Carrusel: fila horizontal con scroll snap. Pausamos auto-advance
          al hover y al touch para no pelearle al usuario. */}
      <div
        ref={scrollerRef}
        data-featured-carousel
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {visible.map((vehicle) => (
          <div
            key={vehicle.id}
            className="w-[280px] shrink-0 snap-start sm:w-[300px]"
          >
            <VehicleCard
              vehicle={vehicle}
              basePath={basePath}
              hideFeaturedBadge
            />
          </div>
        ))}
      </div>
    </div>
  );
}
