"use client";

import { createContext, useContext, useTransition, type TransitionStartFunction } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableTransitionValue {
  isPending: boolean;
  startTransition: TransitionStartFunction;
}

const TableTransitionContext = createContext<TableTransitionValue | null>(null);

/**
 * Comparte UN `useTransition` entre la barra de filtros y la tabla.
 *
 * Filtrar y ordenar navegan a la misma ruta con otros searchParams. React
 * mantiene la UI vieja en pantalla mientras el Server Component se re-renderiza,
 * así que sin esto el usuario ve la tabla anterior congelada, sin ninguna señal
 * de que algo está pasando. `loading.tsx` no cubre este caso: no hay cambio de
 * ruta y la navegación va dentro de una transición.
 *
 * Con el pending compartido, el que dispara la navegación (el menú) y el que
 * muestra el feedback (la tabla) hablan del mismo estado.
 */
export function TableTransitionProvider({ children }: { children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition();
  return (
    <TableTransitionContext.Provider value={{ isPending, startTransition }}>
      {children}
    </TableTransitionContext.Provider>
  );
}

/** Devuelve null si no hay provider — los consumidores caen a su transición local. */
export function useTableTransition(): TableTransitionValue | null {
  return useContext(TableTransitionContext);
}

/**
 * Atenúa su contenido y muestra un spinner mientras hay una navegación en curso.
 *
 * El contenido sigue visible a propósito: mostrar los datos viejos apagados
 * conserva el contexto y evita el salto de layout de un skeleton. Se bloquean
 * los clicks para que no se dispare una acción sobre datos que están por cambiar.
 */
export function TableTransitionOverlay({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const isPending = useTableTransition()?.isPending ?? false;

  return (
    <div className="relative" aria-busy={isPending}>
      <div
        className={cn(
          "space-y-6 transition-opacity duration-200",
          isPending && "pointer-events-none opacity-40 select-none",
          className
        )}
      >
        {children}
      </div>

      {isPending && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-12">
          <span
            role="status"
            className="flex items-center gap-2 rounded-full bg-popover px-3 py-1.5 text-xs font-medium shadow-md ring-1 ring-foreground/10"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Actualizando...
          </span>
        </div>
      )}
    </div>
  );
}
