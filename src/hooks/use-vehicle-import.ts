"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ParsedRow } from "@/lib/import/vehicle-row-parser";
import type { ImportResult } from "@/lib/validators/vehicle-import";

// Techo del archivo. Un .xlsx de vehículos sin imágenes no llega ni cerca: si
// pesa más que esto, casi seguro trae imágenes embebidas que no usamos.
export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

export type ImportStage = "idle" | "parsing" | "preview" | "importing" | "done";

/**
 * Toda la máquina de estados de la importación, separada de la presentación.
 *
 * Vive en un hook para que la UI (hoy una solapa, mañana lo que sea) se limite
 * a renderizar: el flujo idle → parsing → preview → importing → done no debería
 * reescribirse cada vez que cambia el layout.
 */
export function useVehicleImport() {
  const router = useRouter();
  const [stage, setStage] = useState<ImportStage>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [unknownHeaders, setUnknownHeaders] = useState<string[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const validRows = useMemo(() => rows.filter((r) => r.errors.length === 0), [rows]);

  const reset = useCallback(() => {
    setStage("idle");
    setFileName(null);
    setRows([]);
    setUnknownHeaders([]);
    setTruncated(false);
    setResult(null);
  }, []);

  const selectFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_IMPORT_FILE_BYTES) {
        toast.error("El archivo es muy grande", { description: "El máximo es 5MB." });
        return;
      }

      setFileName(file.name);
      setResult(null);
      setStage("parsing");

      try {
        // ExcelJS pesa ~900KB: se carga recién cuando hay un archivo real que leer.
        const { readVehicleWorkbook } = await import("@/lib/import/vehicle-workbook");
        const parsed = await readVehicleWorkbook(file);

        if (parsed.rows.length === 0) {
          toast.error("La planilla no tiene filas con datos");
          reset();
          return;
        }

        setRows(parsed.rows);
        setUnknownHeaders(parsed.unknownHeaders);
        setTruncated(parsed.truncated);
        setStage("preview");
      } catch (error) {
        toast.error("No se pudo leer el archivo", {
          description:
            error instanceof Error ? error.message : "Verificá que sea un .xlsx válido.",
        });
        reset();
      }
    },
    [reset]
  );

  const downloadTemplate = useCallback(async (currency: string) => {
    try {
      const { downloadVehicleTemplate } = await import("@/lib/import/vehicle-workbook");
      await downloadVehicleTemplate(currency);
    } catch {
      toast.error("No se pudo generar la plantilla");
    }
  }, []);

  const importRows = useCallback(async () => {
    setStage("importing");
    try {
      const res = await fetch("/api/vehiculos/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: validRows.map((row) => ({ rowNumber: row.rowNumber, vehicle: row.data })),
        }),
      });

      const json: { data?: ImportResult; error?: string } = await res.json();
      if (!res.ok || !json.data) {
        toast.error(json.error ?? "No se pudo completar la importación");
        setStage("preview");
        return;
      }

      setResult(json.data);
      setStage("done");

      if (json.data.imported > 0) {
        toast.success(
          `${json.data.imported} ${json.data.imported === 1 ? "vehículo importado" : "vehículos importados"} como borrador`
        );
        // Refresca el Server Component del listado sin desmontar este panel:
        // los borradores nuevos aparecen en la otra solapa sin perder el reporte.
        router.refresh();
      }
    } catch {
      toast.error("Error de conexión. Revisá tu internet e intentá de nuevo.");
      setStage("preview");
    }
  }, [router, validRows]);

  return {
    stage,
    fileName,
    rows,
    validRows,
    unknownHeaders,
    truncated,
    result,
    selectFile,
    downloadTemplate,
    importRows,
    reset,
  };
}
