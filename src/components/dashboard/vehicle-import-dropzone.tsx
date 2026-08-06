"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface VehicleImportDropzoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
  loading?: boolean;
  fileName?: string | null;
}

const ACCEPTED_EXTENSIONS = [".xlsx", ".xlsm"];

function hasValidExtension(name: string): boolean {
  return ACCEPTED_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext));
}

export function VehicleImportDropzone({
  onFile,
  disabled,
  loading,
  fileName,
}: VehicleImportDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [extensionError, setExtensionError] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file) return;
    // Filtramos por extensión antes de gastar el parseo: el MIME que manda el
    // browser para .xlsx es inconsistente entre sistemas operativos.
    if (!hasValidExtension(file.name)) {
      setExtensionError(true);
      return;
    }
    setExtensionError(false);
    onFile(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    handleFile(event.dataTransfer.files?.[0]);
  }

  function openPicker() {
    if (!disabled) inputRef.current?.click();
  }

  return (
    <div className="space-y-2">
      {/* Zona clickeable y soltable a la vez. El input real queda oculto: el
          file input nativo no se puede estilar de forma consistente. */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Subir planilla de vehículos"
        aria-disabled={disabled}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-6 py-10 text-center transition-colors",
          "rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          dragging ? "border-foreground/40 bg-muted/60" : "border-input hover:bg-muted/40",
          disabled && "pointer-events-none opacity-60"
        )}
      >
        {loading ? (
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        ) : (
          <UploadCloud
            className={cn(
              "h-7 w-7 transition-transform",
              dragging ? "-translate-y-0.5 text-foreground" : "text-muted-foreground"
            )}
          />
        )}
        <div>
          <p className="text-sm font-medium">
            {loading ? "Leyendo la planilla..." : "Arrastrá tu planilla o hacé clic para elegirla"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Archivos .xlsx o .xlsm de hasta 5MB
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            // Se limpia el value para que volver a elegir el MISMO archivo
            // (después de corregirlo en Excel) dispare el change igual.
            e.target.value = "";
          }}
        />
      </div>

      {extensionError && (
        <p className="text-xs text-destructive">
          Ese formato no sirve. Necesitamos un archivo .xlsx o .xlsm — si tenés un .csv o un
          .xls viejo, abrilo en Excel y guardalo como &ldquo;Libro de Excel (.xlsx)&rdquo;.
        </p>
      )}

      {fileName && !loading && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground/80">{fileName}</span>
        </p>
      )}
    </div>
  );
}
