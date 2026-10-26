import { cn } from "@/lib/utils";
import { FadeIn } from "./fade-in";

interface SectionHeadingProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** "dark" para las bandas en azul oscuro. */
  tone?: "light" | "dark";
  className?: string;
}

/**
 * Título de sección de la landing. Una sola escala tipográfica (clamp) para
 * que todas las secciones se lean igual de 320px a 1440px.
 */
export function SectionHeading({ title, subtitle, tone = "light", className }: SectionHeadingProps) {
  const dark = tone === "dark";

  return (
    <FadeIn className={cn("max-w-2xl", className)}>
      <h2
        className={cn(
          "font-display text-[clamp(2rem,4.2vw,3rem)] font-light leading-[1.05] tracking-tight text-balance",
          dark ? "text-white" : "text-ink"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={cn("mt-4 text-base sm:text-lg", dark ? "text-white/70" : "text-ink-soft")}>
          {subtitle}
        </p>
      )}
    </FadeIn>
  );
}
