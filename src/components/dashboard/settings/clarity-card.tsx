"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MousePointerClick, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ClarityCardProps {
  projectId: string | null;
  // Plan gating — viene del server
  allowClarity: boolean;
  currentPlan: string;
}

const PROJECT_ID_PATTERN = /^[a-z0-9]{6,20}$/i;

export function ClarityCard({ projectId, allowClarity, currentPlan }: ClarityCardProps) {
  const [localProjectId, setLocalProjectId] = useState(projectId ?? "");
  const [loading, setLoading] = useState(false);

  const isLocked = !allowClarity;
  const trimmed = localProjectId.trim();
  const projectIdInvalid = trimmed !== "" && !PROJECT_ID_PATTERN.test(trimmed);

  async function handleSave() {
    if (isLocked || projectIdInvalid) return;
    setLoading(true);
    try {
      const res = await fetch("/api/concesionario", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clarityProjectId: trimmed || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al guardar");
        return;
      }
      toast.success(trimmed ? "Clarity conectado" : "Clarity desconectado");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-blue-600" />
              Microsoft Clarity
            </CardTitle>
            <CardDescription>
              Mapas de calor y grabaciones de cómo navegan tu sitio. Ves dónde
              hacen clic, hasta dónde bajan y dónde abandonan antes de
              consultarte. Es gratis y los datos van a TU cuenta de Clarity.
            </CardDescription>
          </div>
          {isLocked && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              <Sparkles className="h-3 w-3" />
              Plan Media o superior
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {isLocked && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium">Tu plan actual ({currentPlan}) no incluye esta feature.</p>
              <p className="mt-1 text-xs text-amber-800">
                Mejorá al plan Media o superior para ver cómo usan tu sitio los
                visitantes que llegan de tus publicidades.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="clarity-project-id">ID del proyecto</Label>
          <Input
            id="clarity-project-id"
            value={localProjectId}
            onChange={(e) => setLocalProjectId(e.target.value)}
            placeholder="abc123xyz0"
            disabled={isLocked}
            autoComplete="off"
            aria-invalid={projectIdInvalid}
          />
          {projectIdInvalid ? (
            <p className="text-xs text-destructive">
              El ID son letras y números, sin espacios. Copialo de Clarity →
              Settings → Overview.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Creá un proyecto gratis en clarity.microsoft.com con la dirección
              de tu sitio y copiá el &ldquo;Project ID&rdquo; desde Settings →
              Overview. Dejalo vacío para desconectarlo.
            </p>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <Button onClick={handleSave} disabled={loading || isLocked || projectIdInvalid}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
