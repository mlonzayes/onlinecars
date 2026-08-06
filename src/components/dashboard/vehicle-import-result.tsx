"use client";

import { CheckCircle2, Info } from "lucide-react";
import type { ImportResult, SkipReason } from "@/lib/validators/vehicle-import";

interface VehicleImportResultViewProps {
  result: ImportResult;
}

const REASON_LABELS: Record<SkipReason, string> = {
  duplicate: "Ya existía",
  invalid: "Datos inválidos",
  error: "Error al guardar",
};

/**
 * Reporte final de la importación.
 *
 * El requisito es explícito: importamos todo lo que se pueda y le decimos al
 * dealer, fila por fila, qué quedó afuera y por qué. Nada de fallar en silencio.
 */
export function VehicleImportResultView({ result }: VehicleImportResultViewProps) {
  const { imported, skipped } = result;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-md border bg-muted/40 p-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="font-medium">
            {imported === 0
              ? "No se importó ningún vehículo"
              : `Se importaron ${imported} ${imported === 1 ? "vehículo" : "vehículos"}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {imported > 0
              ? "Quedaron como borrador. Revisalos y publicalos cuando estén listos."
              : "Revisá el detalle de abajo y volvé a intentar."}
          </p>
        </div>
      </div>

      {skipped.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4 text-amber-600" />
            <p className="font-medium">
              {skipped.length} {skipped.length === 1 ? "fila quedó" : "filas quedaron"} sin cargar
            </p>
          </div>

          <div className="max-h-56 overflow-y-auto rounded-md border">
            <ul className="divide-y text-xs">
              {skipped.map((row) => (
                <li key={`${row.rowNumber}-${row.reason}`} className="px-3 py-2">
                  <p className="font-medium">
                    Fila {row.rowNumber}
                    {row.label && (
                      <span className="ml-2 font-normal text-muted-foreground">{row.label}</span>
                    )}
                    <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                      {REASON_LABELS[row.reason]}
                    </span>
                  </p>
                  <p className="mt-0.5 text-muted-foreground">{row.message}</p>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            Corregí estas filas en tu planilla y volvé a subirla: los vehículos que ya se
            importaron no se van a duplicar.
          </p>
        </div>
      )}
    </div>
  );
}
