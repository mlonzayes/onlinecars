"use client";

import { useRef } from "react";
import { useRevealOnScroll } from "@/hooks/use-reveal-on-scroll";
import { RoadmapItem, type RoadmapItemProps } from "./roadmap-item";

interface RoadmapTimelineProps {
  items: RoadmapItemProps[];
}

const STAGGER_SECONDS = 0.06;

function getCards(node: HTMLElement): HTMLElement[] {
  return Array.from(node.querySelectorAll<HTMLElement>("[data-roadmap-card]"));
}

/**
 * Timeline del roadmap de /precios. Sin GSAP:
 *  - Las cards entran con IntersectionObserver + CSS (useRevealOnScroll).
 *  - La línea se "dibuja" con una animación CSS atada al scroll
 *    (`.roadmap-line` en globals.css). Donde no hay scroll-timeline, se ve
 *    completa desde el principio.
 * Antes eran un ScrollTrigger con scrub + uno por card + un tilt 3D al hover,
 * todo midiendo layout en el mount.
 */
export function RoadmapTimeline({ items }: RoadmapTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useRevealOnScroll(containerRef, { stagger: STAGGER_SECONDS, getTargets: getCards });

  return (
    <div ref={containerRef} className="relative mx-auto mt-12 max-w-2xl">
      <div
        aria-hidden
        className="roadmap-line pointer-events-none absolute bottom-4 left-4 top-4 w-0.5 origin-top bg-gradient-to-b from-blue-400 via-blue-300 to-gray-200"
      />
      <div className="flex flex-col gap-6">
        {items.map((item) => (
          <div
            key={item.title}
            data-roadmap-card
            className="transition-[translate] duration-300 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          >
            <RoadmapItem {...item} />
          </div>
        ))}
      </div>
    </div>
  );
}
