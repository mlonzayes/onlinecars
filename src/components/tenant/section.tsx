import { cn } from "@/lib/utils";

// Wrapper de sección estándar para el sitio tenant. Aplica:
// - Padding vertical generoso (Boxcar usa ~80-96px)
// - Container max-w-7xl con padding horizontal responsive
// - Soporta fondo alternado (white | muted) para alternar visualmente entre secciones
// - Header opcional con eyebrow / title / description, alineado center o left

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  // Fondo de la sección. "muted" usa bg-[var(--tenant-bg)] para alternar contra el bg-[var(--tenant-surface)] default.
  background?: "white" | "muted";
  // Si querés padding diferente al estándar.
  padding?: "default" | "tight" | "none";
  // Si pasás eyebrow / title, se renderiza el header de la sección.
  eyebrow?: string;
  title?: string;
  description?: string;
  // "center" (default para landings) o "left" (para secciones más utilitarias).
  align?: "center" | "left";
  id?: string;
}

const PADDING_CLASSES: Record<NonNullable<SectionProps["padding"]>, string> = {
  default: "py-16 sm:py-20 lg:py-24",
  tight: "py-10 sm:py-12 lg:py-16",
  none: "",
};

export function Section({
  children,
  className,
  background = "white",
  padding = "default",
  eyebrow,
  title,
  description,
  align = "center",
  id,
}: SectionProps) {
  const showHeader = !!(eyebrow || title || description);

  return (
    <section
      id={id}
      className={cn(
        background === "muted" ? "bg-[var(--tenant-bg)]" : "bg-[var(--tenant-surface)]",
        PADDING_CLASSES[padding],
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {showHeader && (
          <header
            className={cn(
              "mb-10 sm:mb-12",
              align === "center" ? "text-center" : "text-left"
            )}
          >
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--tenant-primary)]">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2
                className={cn(
                  "mt-2 text-2xl font-semibold text-[var(--tenant-fg)] sm:text-3xl",
                  eyebrow && "mt-2"
                )}
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                className={cn(
                  "mt-3 text-base text-[var(--tenant-fg-muted)]",
                  align === "center" && "mx-auto max-w-2xl"
                )}
              >
                {description}
              </p>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
