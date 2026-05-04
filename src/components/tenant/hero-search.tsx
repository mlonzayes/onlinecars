"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { VEHICLE_CONDITIONS } from "@/lib/constants";

interface HeroSearchProps {
  basePath: string;
  brands: string[];
  // Hero customizable por dealer (theme).
  heroType?: "image" | "video" | "none";
  heroUrl?: string | null;
  primaryColor: string;
  // Headline opcional para customizar; si no hay, usa el del template.
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

export function HeroSearch({
  basePath,
  brands,
  heroType = "none",
  heroUrl,
  primaryColor,
  headline = "Encontrá tu próximo auto",
  subhead = "Buscá en nuestro stock por marca, condición o presupuesto.",
}: HeroSearchProps) {
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (brand) params.set("brand", brand);
    if (condition) params.set("condition", condition);
    if (maxPrice) params.set("maxPrice", maxPrice);
    const qs = params.toString();
    router.push(`${basePath}/catalogo${qs ? `?${qs}` : ""}`);
  }

  const showImage = heroType === "image" && heroUrl;
  const showVideo = heroType === "video" && heroUrl;

  return (
    <section className="relative isolate overflow-hidden ">
      {/* Background media */}
      {showImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroUrl})` }}
        />
      )}
      {showVideo && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={heroUrl ?? ""} type="video/mp4" />
        </video>
      )}
      {/* Default decorative gradient if no media */}
      {heroType === "none" && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 30%, ${primaryColor} 0%, transparent 55%), radial-gradient(circle at 75% 70%, ${primaryColor} 0%, transparent 55%)`,
          }}
        />
      )}
      {/* Overlay para legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-slate-900/90" />

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            {headline}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
            {subhead}
          </p>
        </div>

        {/* Search bar */}
        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-10 max-w-4xl rounded-2xl bg-white/95 p-3 shadow-2xl backdrop-blur-sm sm:mt-12 sm:p-2"
        >
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
            {/* Marca */}
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="h-12 rounded-xl border-0 bg-transparent px-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[var(--tenant-primary)]/30 sm:h-11"
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
              className="h-12 rounded-xl border-0 bg-transparent px-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[var(--tenant-primary)]/30 sm:h-11 sm:border-l sm:border-slate-200"
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
              className="h-12 rounded-xl border-0 bg-transparent px-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[var(--tenant-primary)]/30 sm:h-11 sm:border-l sm:border-slate-200"
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
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--tenant-primary)] px-6 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 sm:h-11"
            >
              <Search className="h-4 w-4" />
              Buscar
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
