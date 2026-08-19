"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import {
  ScrollTrigger,
  gsap,
  useIsomorphicLayoutEffect,
} from "@/lib/gsap";
import type { TenantHomeBundleVehicle } from "@/lib/tenant";

// Cuántos vehículos entran en la tira. Con menos de 4 el loop se nota feo
// (vuelve al principio muy rápido); con más de 10 el DOM duplicado empieza a
// pesar sin que el usuario llegue a ver la diferencia.
const MARQUEE_CAP = 10;
const MIN_ITEMS = 4;

// Segundos para recorrer un set completo. Alto a propósito: la tira es fondo,
// no contenido — si se mueve rápido compite con la lectura.
const LOOP_SECONDS = 45;

interface StockMarqueeProps {
  vehicles: TenantHomeBundleVehicle[];
  basePath: string;
}

/**
 * Tira horizontal infinita con fotos del stock.
 *
 * Qué resuelve: comunicar VOLUMEN sin gastar una pantalla entera en una grilla.
 * Va entre el hero y el primer bloque de contenido, donde una grilla más sería
 * redundante.
 *
 * El truco del loop: se renderiza el set de fotos DOS veces y se anima el track
 * hasta -50%. En ese punto el segundo set está exactamente donde arrancó el
 * primero, así que el `repeat: -1` no tiene costura visible.
 *
 * La velocidad del scroll acelera la tira y después vuelve sola a la velocidad
 * base. Ese detalle es el que hace que se sienta viva en vez de un GIF.
 */
export function StockMarquee({ vehicles, basePath }: StockMarqueeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  // Referencia al loop para que el hover lo pueda frenar. Queda null si el
  // usuario pidió menos movimiento (nunca se crea el tween), y ahí los handlers
  // de hover son no-ops — que es exactamente lo que corresponde.
  const loopRef = useRef<gsap.core.Tween | null>(null);

  const items = vehicles
    .filter((v) => v.images.length > 0)
    .slice(0, MARQUEE_CAP);

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;
    if (items.length < MIN_ITEMS) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const loop = gsap.to(track, {
          xPercent: -50,
          duration: LOOP_SECONDS,
          ease: "none",
          repeat: -1,
        });
        loopRef.current = loop;

        // Proxy animable para volver suave a la velocidad base. Escribir
        // timeScale directo en cada onUpdate daría saltos: el scroll dispara
        // muchos eventos por segundo y cada uno pisaría al anterior.
        const speed = { value: 1 };

        const st = ScrollTrigger.create({
          trigger: container,
          start: "top bottom",
          end: "bottom top",
          // Pausar fuera de viewport: una animación infinita corriendo sin que
          // nadie la vea es batería regalada en mobile.
          onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
          onUpdate: (self) => {
            speed.value = gsap.utils.clamp(
              1,
              5,
              1 + Math.abs(self.getVelocity()) / 1000
            );
            loop.timeScale(speed.value);
            gsap.to(speed, {
              value: 1,
              duration: 1,
              ease: "power2.out",
              overwrite: true,
              onUpdate: () => loop.timeScale(speed.value),
            });
          },
        });

        return () => {
          st.kill();
          loop.kill();
          loopRef.current = null;
        };
      });
    }, container);

    return () => ctx.revert();
  }, [items.length]);

  // Sin stock suficiente la tira se auto-oculta: cuatro fotos dando vueltas
  // dejan en evidencia que no hay catálogo.
  if (items.length < MIN_ITEMS) return null;

  // Dos pasadas del mismo set. La segunda es decorativa — va aria-hidden y sin
  // foco para que el lector de pantalla y el tab no la recorran dos veces.
  const sets = [
    { key: "a", hidden: false },
    { key: "b", hidden: true },
  ];

  return (
    <section
      ref={containerRef}
      className="overflow-hidden border-y border-[var(--tenant-border)] bg-[var(--tenant-bg)] py-6"
      aria-label="Vehículos en stock"
    >
      {/* Pausa en hover: son links que se están moviendo, y un target móvil es
          imposible de clickear. Al frenar, la tira se vuelve usable. */}
      <div
        ref={trackRef}
        className="flex w-max gap-4"
        onMouseEnter={() => loopRef.current?.pause()}
        onMouseLeave={() => loopRef.current?.resume()}
      >
        {sets.map((set) =>
          items.map((vehicle) => {
            const image = vehicle.images.find((i) => i.isPrimary) ?? vehicle.images[0];
            return (
              <Link
                key={`${set.key}-${vehicle.id}`}
                href={`${basePath}/vehiculo/${vehicle.publicSlug}`}
                aria-hidden={set.hidden}
                tabIndex={set.hidden ? -1 : undefined}
                className="group/item relative block h-40 w-64 shrink-0 overflow-hidden rounded-[var(--tenant-radius-sm)] sm:h-48 sm:w-80"
              >
                <Image
                  src={image.url}
                  alt={image.alt ?? vehicle.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover/item:scale-105"
                  sizes="(max-width: 640px) 16rem, 20rem"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
                />
                <p className="absolute bottom-3 left-3 text-xs font-medium uppercase tracking-[0.12em] text-white">
                  {vehicle.brand} {vehicle.model}
                </p>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
