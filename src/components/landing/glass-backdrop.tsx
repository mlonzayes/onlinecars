import { cn } from "@/lib/utils";

interface Blob {
  /** Posición y tamaño en clases de Tailwind (top/left/size). */
  className: string;
  color: string;
}

const BLOBS: Record<"cool" | "lilac" | "night", Blob[]> = {
  cool: [
    { className: "-left-40 top-[-10%] size-[34rem]", color: "rgba(37, 99, 235, 0.42)" },
    { className: "right-[-12rem] top-[30%] size-[30rem]", color: "rgba(150, 165, 255, 0.55)" },
    { className: "bottom-[-14rem] left-[30%] size-[28rem]", color: "rgba(56, 120, 255, 0.3)" },
  ],
  // Para bandas oscuras (bg-navy) con tarjetas `.glass-card-dark`
  night: [
    { className: "-left-32 top-[-20%] size-[32rem]", color: "rgba(37, 99, 235, 0.55)" },
    { className: "right-[-10rem] bottom-[-30%] size-[34rem]", color: "rgba(150, 165, 255, 0.35)" },
  ],
  lilac: [
    { className: "-right-32 top-[-8%] size-[32rem]", color: "rgba(150, 165, 255, 0.55)" },
    { className: "left-[-10rem] bottom-[-10%] size-[30rem]", color: "rgba(37, 99, 235, 0.35)" },
  ],
};

interface GlassBackdropProps {
  variant?: keyof typeof BLOBS;
  className?: string;
}

/**
 * Fondo abstracto para las secciones con tarjetas de vidrio (`.glass-card`):
 * manchas de color que el `backdrop-filter` de las tarjetas desenfoca.
 *
 * Sin `filter: blur()` ni JS: cada mancha es un radial-gradient (se pinta una
 * vez y queda en su capa) y la deriva es CSS scroll-driven sobre transform. La
 * sección padre necesita `relative isolate overflow-hidden`.
 */
export function GlassBackdrop({ variant = "cool", className }: GlassBackdropProps) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      {BLOBS[variant].map((blob, i) => (
        <span
          key={i}
          className={cn("glass-blob", i % 2 === 0 ? "sd-drift-up" : "sd-drift-down", blob.className)}
          style={{ "--blob": blob.color } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
