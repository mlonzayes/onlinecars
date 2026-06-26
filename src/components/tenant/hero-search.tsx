"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car, MessageCircle, Search, Tag } from "lucide-react";
import { VEHICLE_CONDITIONS } from "@/lib/constants";
import type { TenantHomeBundleMedia, TenantHomeBundleSection } from "@/lib/tenant";
import type { HeroConfig } from "@/lib/sections/config-types";
import { DURATION, EASE, gsap, useIsomorphicLayoutEffect } from "@/lib/gsap";

interface HeroSearchProps {
  basePath: string;
  brands: string[];
  primaryColor: string;
  // Nuevos props (preferidos): la sección con su config + media específica del hero.
  section?: TenantHomeBundleSection;
  media?: TenantHomeBundleMedia[];
  // Fallbacks legacy: usados solo si no llega `section`. Se mantienen por compat con
  // posibles callers fuera del nuevo dispatcher.
  heroType?: "image" | "video" | "none";
  heroUrl?: string | null;
  headline?: string;
  subhead?: string;
}

const PRICE_OPTIONS = [
  { value: "5000000", label: "Hasta $5.000.000" },
  { value: "10000000", label: "Hasta $10.000.000" },
  { value: "20000000", label: "Hasta $20.000.000" },
  { value: "30000000", label: "Hasta $30.000.000" },
  { value: "50000000", label: "Hasta $50.000.000" },
];

// Resuelve la fuente del hero priorizando los media subidos por el dealer.
// Orden: hero_video > hero_image > fallback legacy theme.heroType/heroUrl.
function resolveHeroSource(
  media: TenantHomeBundleMedia[] | undefined,
  legacyType: "image" | "video" | "none",
  legacyUrl: string | null | undefined
): { kind: "image" | "video" | "none"; url: string | null; posterUrl: string | null } {
  const video = media?.find((m) => m.purpose === "hero_video");
  const image = media?.find((m) => m.purpose === "hero_image");

  if (video) {
    return { kind: "video", url: video.url, posterUrl: image?.url ?? null };
  }
  if (image) {
    return { kind: "image", url: image.url, posterUrl: null };
  }
  if (legacyType !== "none" && legacyUrl) {
    return { kind: legacyType, url: legacyUrl, posterUrl: null };
  }
  return { kind: "none", url: null, posterUrl: null };
}

export function HeroSearch({
  basePath,
  brands,
  primaryColor,
  section,
  media,
  heroType = "none",
  heroUrl,
  headline,
  subhead,
}: HeroSearchProps) {
  const router = useRouter();
  const scopeRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  // showVideo: se decide en cliente tras montar (false en SSR → el video NO
  // viaja en el HTML inicial, así mobile nunca lo baja). videoReady: gatilla el
  // fade-in cuando el video puede reproducirse.
  const [showVideo, setShowVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  // Animacion de entrada del hero: solo el contenido (titulo + subtitulo + form).
  // El fondo (image/video/gradient) queda intacto para no provocar parpadeos.
  useIsomorphicLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const ctx = gsap.context(() => {
      const candidates: Array<HTMLElement | null> = [
        titleRef.current,
        subtitleRef.current,
        formRef.current,
      ];
      const targets = candidates.filter(
        (el): el is HTMLElement => el !== null
      );
      if (targets.length === 0) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(targets, { autoAlpha: 0, y: 24 });
        gsap.to(targets, {
          autoAlpha: 1,
          y: 0,
          duration: DURATION,
          ease: EASE,
          stagger: 0.08,
        });
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(targets, { autoAlpha: 1, y: 0 });
      });
    }, scope);

    return () => ctx.revert();
  }, []);

  // Resolver headline/subhead/config desde la sección si vino, si no usar props legacy.
  const resolvedHeadline = section?.title ?? headline ?? "Encontrá tu próximo auto";
  const resolvedSubhead =
    section?.subtitle ??
    subhead ??
    "Buscá en nuestro stock por marca, condición o presupuesto.";

  const config = (section?.config as HeroConfig | undefined) ?? {
    overlay: 70,
    align: "center" as const,
    showSearch: true,
    showQuickActions: false,
  };

  const heroSource = useMemo(
    () => resolveHeroSource(media, heroType, heroUrl ?? null),
    [media, heroType, heroUrl]
  );

  // Decide en cliente si montar el video de fondo. NO se monta en mobile, con
  // ahorro de datos activado, conexión lenta (2g) o reduce-motion: en esos casos
  // se queda la capa base (poster/degradé) y se ahorran ~3.5 MB por visita.
  useEffect(() => {
    if (heroSource.kind !== "video") return;
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conn = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    const saveData = conn?.saveData === true;
    const slow = conn?.effectiveType ? /2g/.test(conn.effectiveType) : false;
    if (isDesktop && !reduced && !saveData && !slow) {
      setShowVideo(true);
    }
  }, [heroSource.kind]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (brand) params.set("brand", brand);
    if (condition) params.set("condition", condition);
    if (maxPrice) params.set("maxPrice", maxPrice);
    const qs = params.toString();
    router.push(`${basePath}/catalogo${qs ? `?${qs}` : ""}`);
  }

  // Overlay 0-100 → opacidad sobre el degradé. Lo aplicamos al div del overlay.
  const overlayOpacity = Math.min(100, Math.max(0, config.overlay)) / 100;
  const alignClass = config.align === "left" ? "text-left" : "text-center";
  const headlineWrapperClass =
    config.align === "left" ? "max-w-3xl" : "mx-auto max-w-3xl text-center";

  return (
    // h-[100dvh]: ocupa la altura REAL del viewport (descuenta address bar en
    // mobile, evita el espacio en blanco). -mt-24 hace que el hero arranque
    // BAJO el navbar flotante (compensa el pt-24 que el layout aplica al main).
    <section ref={scopeRef} className="relative isolate -mt-24 flex h-[100dvh] flex-col justify-center overflow-hidden bg-slate-900">
      {/* Background media */}
      {heroSource.kind === "image" && heroSource.url && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroSource.url})` }}
        />
      )}
      {heroSource.kind === "video" && heroSource.url && (
        <>
          {/* Capa base SIEMPRE presente: poster (si el dealer subió hero_image)
              o el degradé de marca. Mata el rectángulo negro mientras carga el
              video y es lo ÚNICO que se ve en mobile/conexión lenta. */}
          {heroSource.posterUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${heroSource.posterUrl})` }}
            />
          ) : (
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle at 25% 30%, ${primaryColor} 0%, transparent 55%), radial-gradient(circle at 75% 70%, ${primaryColor} 0%, transparent 55%)`,
              }}
            />
          )}
          {/* Video: solo se monta en desktop con buena conexión (decidido en
              cliente). Fade-in al estar listo para no saltar sobre la capa base. */}
          {showVideo && (
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={heroSource.posterUrl ?? undefined}
              onCanPlay={() => setVideoReady(true)}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                videoReady ? "opacity-100" : "opacity-0"
              }`}
            >
              <source src={heroSource.url} type="video/mp4" />
            </video>
          )}
        </>
      )}
      {/* Default decorative gradient if no media */}
      {heroSource.kind === "none" && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 30%, ${primaryColor} 0%, transparent 55%), radial-gradient(circle at 75% 70%, ${primaryColor} 0%, transparent 55%)`,
          }}
        />
      )}
      {/* Overlay para legibilidad — opacidad controlable desde config.overlay (0-100) */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-900"
        style={{ opacity: overlayOpacity }}
      />

      {/* Content */}
      <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className={headlineWrapperClass}>
          <h1
            ref={titleRef}
            className={`text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl ${alignClass}`}
          >
            {resolvedHeadline}
          </h1>
          {resolvedSubhead && (
            <p
              ref={subtitleRef}
              className={`mt-4 max-w-xl text-base text-slate-300 sm:text-lg ${
                config.align === "center" ? "mx-auto text-center" : ""
              }`}
            >
              {resolvedSubhead}
            </p>
          )}
        </div>

        {/* Search bar — Glass real: container ultra-transparente (bg-[var(--tenant-surface)]/15)
            con cada select como "chip" propio (bg-[var(--tenant-surface)]/30 + border + rounded).
            Eso hace que (a) se vea el video por detrás, (b) los bordes
            redondeados de cada elemento se vean, (c) el conjunto resalte
            por el ring blanco + shadow oscuro. */}
        {config.showSearch && (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="mx-auto mt-10 max-w-4xl rounded-3xl bg-[var(--tenant-surface)]/15 p-2 shadow-2xl shadow-black/40 ring-1 ring-white/30 backdrop-blur-2xl sm:mt-12"
          >
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
              {/* Marca */}
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="h-12 rounded-2xl border border-white/30 bg-[var(--tenant-surface)]/30 px-4 text-sm font-medium text-[var(--tenant-fg)] outline-none backdrop-blur-md transition-colors focus:bg-[var(--tenant-surface)]/40 focus:ring-2 focus:ring-[var(--tenant-primary)]/40 sm:h-11"
                aria-label="Marca"
              >
                <option value="">Cualquier marca</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              {/* Condición */}
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="h-12 rounded-2xl border border-white/30 bg-[var(--tenant-surface)]/30 px-4 text-sm font-medium text-[var(--tenant-fg)] outline-none backdrop-blur-md transition-colors focus:bg-[var(--tenant-surface)]/40 focus:ring-2 focus:ring-[var(--tenant-primary)]/40 sm:h-11"
                aria-label="Condición"
              >
                <option value="">Cualquier condición</option>
                {VEHICLE_CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c === "new" ? "0 km" : "Usado"}
                  </option>
                ))}
              </select>

              {/* Precio máx */}
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="h-12 rounded-2xl border border-white/30 bg-[var(--tenant-surface)]/30 px-4 text-sm font-medium text-[var(--tenant-fg)] outline-none backdrop-blur-md transition-colors focus:bg-[var(--tenant-surface)]/40 focus:ring-2 focus:ring-[var(--tenant-primary)]/40 sm:h-11"
                aria-label="Precio máximo"
              >
                <option value="">Cualquier precio</option>
                {PRICE_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>

              {/* Botón */}
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--tenant-primary)] px-6 text-sm font-semibold text-white shadow-lg shadow-black/30 transition-all hover:scale-[1.02] hover:shadow-xl sm:h-11"
              >
                <Search className="h-4 w-4" />
                Buscar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Quick-action cards — strip al pie del hero. Visibles SOLO si el dealer
          activó showQuickActions desde el admin. Glass real: bg-[var(--tenant-surface)]/10 +
          backdrop-blur-xl + border-white/20. Texto blanco para legibilidad
          sobre el video. */}
      {config.showQuickActions && (
        <div className="relative mx-auto mb-[-3rem] w-full max-w-5xl px-4 pb-2 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <Link
              href={`${basePath}/catalogo`}
              className="group flex items-center gap-3 rounded-2xl border border-white/20 bg-[var(--tenant-surface)]/10 p-4 shadow-xl backdrop-blur-xl transition-all hover:-translate-y-1 hover:bg-[var(--tenant-surface)]/15 hover:border-white/30"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--tenant-surface)]/15 text-white transition-transform group-hover:scale-110">
                <Car className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">Ver catálogo</span>
                <span className="block truncate text-xs text-white/70">Explorá todo el stock</span>
              </span>
            </Link>

            <Link
              href={`${basePath}/cotizar`}
              className="group flex items-center gap-3 rounded-2xl border border-white/20 bg-[var(--tenant-surface)]/10 p-4 shadow-xl backdrop-blur-xl transition-all hover:-translate-y-1 hover:bg-[var(--tenant-surface)]/15 hover:border-white/30"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--tenant-surface)]/15 text-white transition-transform group-hover:scale-110">
                <Tag className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">Vender mi auto</span>
                <span className="block truncate text-xs text-white/70">Cotización al instante</span>
              </span>
            </Link>

            <Link
              href={`${basePath}#contacto`}
              className="group flex items-center gap-3 rounded-2xl border border-white/20 bg-[var(--tenant-surface)]/10 p-4 shadow-xl backdrop-blur-xl transition-all hover:-translate-y-1 hover:bg-[var(--tenant-surface)]/15 hover:border-white/30"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--tenant-surface)]/15 text-white transition-transform group-hover:scale-110">
                <MessageCircle className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">Contactanos</span>
                <span className="block truncate text-xs text-white/70">Estamos para ayudarte</span>
              </span>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
