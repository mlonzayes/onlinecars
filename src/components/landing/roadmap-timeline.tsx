"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RoadmapItem, type RoadmapItemProps } from "./roadmap-item";
import { TiltCard } from "./tilt-card";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface RoadmapTimelineProps {
  items: RoadmapItemProps[];
}

export function RoadmapTimeline({ items }: RoadmapTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const line = container.querySelector("[data-timeline-line]");
      if (!line) return;

      // La línea se "dibuja" al scrollear. transform-origin: top hace que
      // crezca desde arriba hacia abajo, no del centro.
      gsap.fromTo(
        line,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          force3D: true,
          scrollTrigger: {
            trigger: container,
            start: "top 75%",
            end: "bottom 75%",
            scrub: 0.5,
          },
        }
      );

      // Cada card entra desde un lado distinto con escalas y rotaciones leves
      // para romper la uniformidad — alternancia + jitter intencional.
      const cards = container.querySelectorAll("[data-roadmap-card]");
      cards.forEach((card, i) => {
        const fromX = i % 2 === 0 ? -50 : 30;
        const fromRotate = i % 3 === 0 ? -2 : i % 3 === 1 ? 1.5 : -1;

        gsap.fromTo(
          card,
          {
            opacity: 0,
            x: fromX,
            y: 20,
            scale: 0.96,
            rotate: fromRotate,
          },
          {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            rotate: 0,
            duration: 0.85,
            ease: "back.out(1.2)",
            force3D: true,
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative mx-auto mt-12 max-w-2xl">
      {/* Línea conectora: scaleY animado al scroll. transform-origin top
          hace que la línea crezca desde arriba hacia abajo. */}
      <div
        aria-hidden
        data-timeline-line
        className="pointer-events-none absolute left-4 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-400 via-blue-300 to-gray-200 origin-top"
        style={{ willChange: "transform" }}
      />
      <div className="flex flex-col gap-6">
        {items.map((item) => (
          <div key={item.title} data-roadmap-card>
            <TiltCard maxTilt={4} elevate={false}>
              <RoadmapItem {...item} />
            </TiltCard>
          </div>
        ))}
      </div>
    </div>
  );
}
