"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Palette, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TENANT_TEMPLATES, type TenantTemplateId } from "@/lib/tenant-templates";

interface TemplateSelectorProps {
  currentTemplateId: string;
}

// Mini-preview ASCII del look de cada plantilla. Se renderiza con
// los tokens del template como style inline, así el preview se ve
// real (mismos colores que aplicaría en el sitio).
function TemplatePreview({
  templateId,
  isSelected,
}: {
  templateId: TenantTemplateId;
  isSelected: boolean;
}) {
  const template = TENANT_TEMPLATES[templateId];
  const tokens = template.tokens as Record<string, string>;

  return (
    <div
      className="relative h-32 w-full overflow-hidden rounded-lg border transition-all"
      style={{
        backgroundColor: tokens["--tenant-bg"],
        borderColor: isSelected ? "var(--primary)" : tokens["--tenant-border"],
        borderWidth: isSelected ? 2 : 1,
      }}
    >
      {/* "Nav" */}
      <div
        className="absolute left-2 right-2 top-2 flex items-center gap-1.5 rounded-full px-2 py-1 shadow-sm"
        style={{ backgroundColor: tokens["--tenant-surface"] }}
      >
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: "#3b82f6" }}
        />
        <div
          className="h-1.5 flex-1 rounded"
          style={{ backgroundColor: tokens["--tenant-border-strong"] }}
        />
      </div>

      {/* "Card del vehículo" */}
      <div
        className="absolute bottom-2 left-2 right-2 rounded-md p-1.5 shadow-sm"
        style={{
          backgroundColor: tokens["--tenant-surface"],
          borderWidth: 1,
          borderColor: tokens["--tenant-border"],
          borderStyle: "solid",
        }}
      >
        <div
          className="h-6 w-full rounded"
          style={{ backgroundColor: tokens["--tenant-surface-hover"] }}
        />
        <div className="mt-1 space-y-0.5">
          <div
            className="h-1.5 w-3/4 rounded"
            style={{ backgroundColor: tokens["--tenant-fg"] }}
          />
          <div
            className="h-1 w-1/2 rounded"
            style={{ backgroundColor: tokens["--tenant-fg-muted"] }}
          />
        </div>
      </div>

      {/* Check de seleccionado */}
      {isSelected && (
        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg ring-2 ring-white">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </div>
      )}
    </div>
  );
}

export function TemplateSelector({ currentTemplateId }: TemplateSelectorProps) {
  const router = useRouter();
  const [selected, setSelected] = useState(currentTemplateId);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleSelect(templateId: string) {
    if (templateId === selected || savingId) return;

    const previous = selected;
    setSelected(templateId);
    setSavingId(templateId);

    try {
      const res = await fetch("/api/concesionario", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      if (!res.ok) throw new Error();
      // Refresh para que el server component vuelva a leer dealership
      // y los cambios se reflejen en componentes que dependen del valor.
      router.refresh();
      toast.success(`Plantilla "${TENANT_TEMPLATES[templateId as TenantTemplateId].name}" aplicada`, {
        duration: 2000,
      });
    } catch {
      setSelected(previous);
      toast.error("No se pudo cambiar la plantilla");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-violet-500" />
          Plantilla del sitio
        </CardTitle>
        <CardDescription>
          Elegí el estilo visual de tu sitio público. El cambio aplica al instante en todas las páginas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(TENANT_TEMPLATES) as TenantTemplateId[]).map((id) => {
            const template = TENANT_TEMPLATES[id];
            const isSelected = selected === id;
            const isSaving = savingId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleSelect(id)}
                disabled={isSaving || isSelected}
                className={`group relative flex flex-col gap-3 rounded-xl border bg-card p-3 text-left transition-all ${
                  isSelected
                    ? "border-blue-500 ring-2 ring-blue-500/20"
                    : "border-border hover:border-blue-300 hover:shadow-md"
                } ${isSaving ? "opacity-60" : ""}`}
              >
                <TemplatePreview templateId={id} isSelected={isSelected} />
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {template.name}
                    </h3>
                    {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                    {isSelected && !isSaving && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        Activa
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {template.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
