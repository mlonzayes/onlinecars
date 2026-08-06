"use client";

import { Download, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehicleImportDropzone } from "./vehicle-import-dropzone";
import { VehicleImportPreview } from "./vehicle-import-preview";
import { VehicleImportResultView } from "./vehicle-import-result";
import { ImportStep } from "./vehicle-import-step";
import { useVehicleImport } from "@/hooks/use-vehicle-import";
import { MAX_IMPORT_ROWS } from "@/lib/import/vehicle-columns";

interface VehicleImportPanelProps {
  /** Moneda del concesionario, para la fila de ejemplo de la plantilla. */
  dealershipCurrency: string;
}

export function VehicleImportPanel({ dealershipCurrency }: VehicleImportPanelProps) {
  const {
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
  } = useVehicleImport();

  const busy = stage === "parsing" || stage === "importing";
  const showReview = stage === "preview" || stage === "importing";

  return (
    <div className="mx-auto max-w-3xl py-2">
      <div className="mb-6">
        <h2 className="font-heading text-lg font-medium">Cargar vehículos desde Excel</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hasta {MAX_IMPORT_ROWS} vehículos por archivo. Entran como borrador para que los
          revises antes de publicarlos, así que no consumen el cupo de tu plan.
        </p>
      </div>

      <div className="space-y-0">
        <ImportStep
          number={1}
          title="Descargá la plantilla"
          description="Trae las columnas listas y una hoja de instrucciones con los valores aceptados en cada una."
        >
          <Button variant="outline" size="sm" onClick={() => downloadTemplate(dealershipCurrency)}>
            <Download className="mr-2 h-4 w-4" />
            Descargar plantilla .xlsx
          </Button>
        </ImportStep>

        <ImportStep
          number={2}
          title="Completala y subila"
          description="Un vehículo por fila. Borrá la fila de ejemplo antes de cargar la tuya."
        >
          <VehicleImportDropzone
            onFile={selectFile}
            disabled={stage === "importing"}
            loading={stage === "parsing"}
            fileName={fileName}
          />
        </ImportStep>

        <ImportStep
          number={3}
          title="Revisá y confirmá"
          description="Verificá que los precios se hayan interpretado bien antes de importar."
          isLast
          muted={!showReview && stage !== "done"}
        >
          {stage === "done" && result ? (
            <div className="space-y-4">
              <VehicleImportResultView result={result} />
              <Button variant="outline" size="sm" onClick={reset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Importar otra planilla
              </Button>
            </div>
          ) : showReview ? (
            <div className="space-y-4">
              <VehicleImportPreview
                rows={rows}
                unknownHeaders={unknownHeaders}
                truncated={truncated}
                maxRows={MAX_IMPORT_ROWS}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={importRows} disabled={busy || validRows.length === 0}>
                  <Upload className="mr-2 h-4 w-4" />
                  {stage === "importing"
                    ? "Importando..."
                    : `Importar ${validRows.length} ${validRows.length === 1 ? "vehículo" : "vehículos"}`}
                </Button>
                <Button variant="ghost" size="sm" onClick={reset} disabled={busy}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Cuando subas la planilla vas a ver acá el detalle de lo que se va a importar.
            </p>
          )}
        </ImportStep>
      </div>
    </div>
  );
}
