"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ParsedRow } from "@/lib/import/vehicle-row-parser";

interface VehicleImportPreviewProps {
  rows: ParsedRow[];
  unknownHeaders: string[];
  truncated: boolean;
  maxRows: number;
}

/** Descripción corta de una fila para que el dealer la ubique en su planilla. */
function describeRow(row: ParsedRow): string {
  const brand = row.data.brand ?? "";
  const model = row.data.model ?? "";
  const label = `${brand} ${model}`.trim();
  return label || String(row.data.title ?? "Sin identificar");
}

export function VehicleImportPreview({
  rows,
  unknownHeaders,
  truncated,
  maxRows,
}: VehicleImportPreviewProps) {
  const validRows = rows.filter((r) => r.errors.length === 0);
  const invalidRows = rows.filter((r) => r.errors.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          {validRows.length} listos para importar
        </Badge>
        {invalidRows.length > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {invalidRows.length} con errores
          </Badge>
        )}
      </div>

      {truncated && (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
          El archivo supera las {maxRows} filas. Se van a importar solo las primeras{" "}
          {maxRows}; subí el resto en un segundo archivo.
        </p>
      )}

      {unknownHeaders.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Columnas ignoradas (no forman parte de la plantilla):{" "}
          <span className="font-medium">{unknownHeaders.join(", ")}</span>
        </p>
      )}

      {invalidRows.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Estas filas no se van a importar:
          </p>
          <div className="max-h-52 overflow-y-auto rounded-md border">
            <ul className="divide-y text-xs">
              {invalidRows.map((row) => (
                <li key={row.rowNumber} className="px-3 py-2">
                  <p className="font-medium">
                    Fila {row.rowNumber}
                    <span className="ml-2 font-normal text-muted-foreground">
                      {describeRow(row)}
                    </span>
                  </p>
                  <ul className="mt-1 space-y-0.5 text-muted-foreground">
                    {row.errors.map((issue, i) => (
                      <li key={`${row.rowNumber}-${i}`}>
                        <span className="font-medium text-foreground/80">{issue.column}:</span>{" "}
                        {issue.message}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {validRows.length > 0 && (
        <div className="max-h-52 overflow-y-auto rounded-md border">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Fila</th>
                <th className="px-3 py-2 font-medium">Vehículo</th>
                <th className="px-3 py-2 font-medium">Año</th>
                <th className="px-3 py-2 text-right font-medium">Precio</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {validRows.map((row) => (
                <tr key={row.rowNumber}>
                  <td className="px-3 py-1.5 text-muted-foreground">{row.rowNumber}</td>
                  <td className="px-3 py-1.5">{describeRow(row)}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{String(row.data.year)}</td>
                  {/* Mostramos el precio ya interpretado: es la confirmación de
                      que el separador decimal se leyó como el dealer esperaba. */}
                  <td className="px-3 py-1.5 text-right font-mono">
                    {Number(row.data.price).toLocaleString("es-AR")}{" "}
                    <span className="text-muted-foreground">{String(row.data.currency ?? "")}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
