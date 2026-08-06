"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TENANT_TEMPLATES, TENANT_TEMPLATE_IDS } from "@/lib/tenant-templates";

interface SiteRowActionsProps {
  id: string;
  name: string;
  siteEnabled: boolean;
  templateId: string;
  // Cuenta dada de baja: el sitio queda 404 aunque siteEnabled sea true, así que
  // prender el toggle no alcanza. Deshabilitamos el control y lo explicamos.
  accountActive: boolean;
}

// Mismo estilo que el select de planes en account-row-actions: bg/text
// explícitos para que el dropdown nativo sea legible en dark mode.
const SELECT_CLASS =
  "h-8 rounded-md border bg-background px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

export function SiteRowActions({
  id,
  name,
  siteEnabled,
  templateId,
  accountActive,
}: SiteRowActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmPause, setConfirmPause] = useState(false);

  async function patch(body: Record<string, unknown>, successMsg: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dealerships/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al actualizar");
        return;
      }
      toast.success(successMsg);
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  function handleTemplateChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (next === templateId) return;
    void patch(
      { templateId: next },
      `Plantilla "${TENANT_TEMPLATES[next as keyof typeof TENANT_TEMPLATES].name}" aplicada`
    );
  }

  function handleToggleSite() {
    // Prender es inocuo; apagar tira abajo la web de un cliente en producción.
    // Solo el apagado pide confirmación.
    if (siteEnabled) {
      setConfirmPause(true);
    } else {
      void patch({ siteEnabled: true }, "Sitio activado");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className={SELECT_CLASS}
        value={templateId}
        disabled={loading}
        onChange={handleTemplateChange}
        aria-label={`Plantilla de ${name}`}
      >
        {TENANT_TEMPLATE_IDS.map((t) => (
          <option key={t} value={t} className="bg-background text-foreground">
            {TENANT_TEMPLATES[t].name}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={handleToggleSite}
        disabled={loading || !accountActive}
        title={
          accountActive
            ? undefined
            : "La cuenta está dada de baja: el sitio responde 404 igual"
        }
        className={cn(
          "h-8 shrink-0 rounded-md border px-2.5 text-xs font-medium disabled:opacity-50",
          siteEnabled
            ? "border-red-300 text-red-700 hover:bg-red-50"
            : "border-green-300 text-green-700 hover:bg-green-50"
        )}
      >
        {siteEnabled ? "Pausar" : "Activar"}
      </button>

      {/* Preview: arma el sitio SIN gatear por siteEnabled, así lo revisás antes
          de prenderlo. Nueva pestaña — es el sitio del tenant, no UI del panel. */}
      <a
        href={`/vista-previa?dealership=${id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border px-2.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Eye className="h-3.5 w-3.5" />
        Ver
      </a>

      <ConfirmDialog
        open={confirmPause}
        onOpenChange={(open) => !open && setConfirmPause(false)}
        title={`Pausar el sitio de ${name}`}
        description="El sitio público deja de responder y los visitantes ven un 404. El panel del cliente sigue funcionando normal."
        confirmLabel="Pausar sitio"
        destructive
        onConfirm={async () => {
          await patch({ siteEnabled: false }, "Sitio pausado");
          setConfirmPause(false);
        }}
      />
    </div>
  );
}
