"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { PiCheck } from "react-icons/pi";
import { TiltCard } from "./tilt-card";

export interface PricingCardProps {
  name: string;
  /** Precio mensual en ARS, o null si es "Hablemos" (enterprise) */
  priceArs: number | null;
  description: string;
  features: string[];
  /** Marca esta card como la sugerida — visualmente destacada */
  highlighted?: boolean;
  /** Texto de la badge si highlighted (default: "Más elegida") */
  highlightLabel?: string;
  /** Ancla a la que el botón hace scroll (default: pre-registro) */
  ctaHref?: string;
  ctaLabel?: string;
}

function formatArs(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function PricingCard({
  name,
  priceArs,
  description,
  features,
  highlighted,
  highlightLabel = "Más elegida",
  ctaHref = "#pre-registro",
  ctaLabel,
}: PricingCardProps) {
  const isEnterprise = priceArs === null;
  const buttonText = ctaLabel ?? (isEnterprise ? "Hablemos" : "Anotarme");

  const glowRef = useRef<HTMLDivElement>(null);

  // Glow loop solo en card highlighted: pulse de opacity + scale infinito.
  useLayoutEffect(() => {
    if (!highlighted) return;
    const glow = glowRef.current;
    if (!glow) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.to(glow, {
        opacity: 0.7,
        scale: 1.08,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        force3D: true,
      });
    }, glow);

    return () => ctx.revert();
  }, [highlighted]);

  return (
    <div className="relative h-full">
      {/* Glow loop detrás de la card highlighted. Va por fuera del TiltCard
          para que no rote con la card cuando la rotás con el mouse. */}
      {highlighted && (
        <div
          ref={glowRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-blue-500/30 blur-2xl"
          style={{ opacity: 0.3, willChange: "transform, opacity" }}
        />
      )}

      <TiltCard maxTilt={6} className="h-full">
        <div
          className={`relative flex h-full flex-col gap-4 rounded-xl border p-5 transition-all ${
            highlighted
              ? "border-blue-600 bg-white shadow-lg shadow-blue-100 lg:scale-[1.03]"
              : "border-gray-200 bg-white"
          }`}
        >
          {highlighted && (
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
              {highlightLabel}
            </span>
          )}
          <div>
            <h3 className="text-base font-bold text-gray-900">{name}</h3>
            <p className="mt-0.5 text-xs text-gray-500">{description}</p>
          </div>

          <div>
            {isEnterprise ? (
              <p className="text-2xl font-extrabold text-gray-900">Hablemos</p>
            ) : (
              <p className="text-2xl font-extrabold text-gray-900">
                ${formatArs(priceArs)}
                <span className="ml-1 text-xs font-medium text-gray-500">/ mes</span>
              </p>
            )}
          </div>

          <ul className="flex flex-col gap-2">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-gray-600 sm:text-sm">
                <PiCheck
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                    highlighted ? "text-blue-600" : "text-green-500"
                  }`}
                />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <a
            href={ctaHref}
            className={`mt-auto inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition ${
              highlighted
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "border border-gray-300 text-gray-900 hover:border-gray-900"
            }`}
          >
            {buttonText}
          </a>
        </div>
      </TiltCard>
    </div>
  );
}
