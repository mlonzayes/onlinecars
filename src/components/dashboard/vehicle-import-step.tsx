import { cn } from "@/lib/utils";

interface ImportStepProps {
  number: number;
  title: string;
  description: string;
  children: React.ReactNode;
  /** El último paso no dibuja la línea conectora hacia abajo. */
  isLast?: boolean;
  /** Atenúa el paso mientras todavía no le llegó el turno. */
  muted?: boolean;
}

/**
 * Paso numerado de un flujo guiado.
 *
 * El número va en una columna fija con una línea vertical que conecta los pasos:
 * se lee como una secuencia y no como tres cards sueltas, que es justo la
 * confusión que genera un importador de varios pasos.
 */
export function ImportStep({
  number,
  title,
  description,
  children,
  isLast,
  muted,
}: ImportStepProps) {
  return (
    <div className="relative flex gap-4 pb-8 last:pb-0">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums transition-colors",
            muted
              ? "border-dashed border-input text-muted-foreground"
              : "border-foreground/20 bg-foreground text-background"
          )}
        >
          {number}
        </span>
        {!isLast && <span aria-hidden className="mt-1 w-px flex-1 bg-border" />}
      </div>

      <div className={cn("min-w-0 flex-1 pt-0.5", muted && "opacity-60")}>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="mt-0.5 mb-3 text-xs text-muted-foreground">{description}</p>
        {children}
      </div>
    </div>
  );
}
