"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BarChart3, Sparkles, Lock, ShieldCheck } from "lucide-react";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface MetaPixelCardProps {
  pixelId: string | null;
  /** Booleano, NUNCA el token. El server lo enmascara en el GET. */
  hasCapiToken: boolean;
  testEventCode: string | null;
  enabled: boolean;
  // Plan gating — viene del server
  allowMetaPixel: boolean;
  currentPlan: string;
}

const PIXEL_ID_PATTERN = /^\d{10,20}$/;

export function MetaPixelCard({
  pixelId,
  hasCapiToken,
  testEventCode,
  enabled,
  allowMetaPixel,
  currentPlan,
}: MetaPixelCardProps) {
  const [localPixelId, setLocalPixelId] = useState(pixelId ?? "");
  const [localToken, setLocalToken] = useState("");
  const [tokenSaved, setTokenSaved] = useState(hasCapiToken);
  const [localTestCode, setLocalTestCode] = useState(testEventCode ?? "");
  const [localEnabled, setLocalEnabled] = useState(enabled);
  const [loading, setLoading] = useState(false);
  const [confirmRemoveToken, setConfirmRemoveToken] = useState(false);

  const isLocked = !allowMetaPixel;
  const pixelIdInvalid = localPixelId.trim() !== "" && !PIXEL_ID_PATTERN.test(localPixelId.trim());

  async function save(body: Record<string, unknown>): Promise<boolean> {
    setLoading(true);
    try {
      const res = await fetch("/api/concesionario", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al guardar");
        return false;
      }
      return true;
    } catch {
      toast.error("Error de conexión");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (isLocked || pixelIdInvalid) return;

    const trimmedToken = localToken.trim();
    const ok = await save({
      metaPixelId: localPixelId.trim() || null,
      metaTestEventCode: localTestCode.trim() || null,
      metaTrackingEnabled: localEnabled,
      // El token va SOLO si el dealer escribió uno nuevo. Mandarlo vacío lo
      // borraría cada vez que guarda cualquier otro campo de esta tarjeta.
      ...(trimmedToken ? { metaCapiToken: trimmedToken } : {}),
    });

    if (!ok) return;
    if (trimmedToken) {
      setTokenSaved(true);
      setLocalToken("");
    }
    toast.success("Configuración de Meta guardada");
  }

  async function handleRemoveToken() {
    try {
      const ok = await save({ metaCapiToken: null });
      if (!ok) return;
      setTokenSaved(false);
      setLocalToken("");
      toast.success("Token eliminado");
    } finally {
      setConfirmRemoveToken(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Píxel de Meta (Facebook e Instagram)
            </CardTitle>
            <CardDescription>
              Medí las visitas y las consultas que generan tus publicidades. Los
              datos van a TU cuenta de Meta, no a la nuestra.
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
                Mejorá al plan Media o superior para medir tus campañas y saber
                cuánto te cuesta cada consulta.
              </p>
            </div>
          </div>
        )}

        <label className="flex cursor-pointer items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Activar medición en mi sitio</p>
            <p className="text-xs text-muted-foreground">
              Si está apagado, no se envía ningún dato a Meta.
            </p>
          </div>
          <input
            type="checkbox"
            checked={localEnabled}
            disabled={isLocked}
            onChange={(e) => setLocalEnabled(e.target.checked)}
            className="h-5 w-9 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>

        <div className="space-y-2">
          <Label htmlFor="meta-pixel-id">ID del píxel</Label>
          <Input
            id="meta-pixel-id"
            value={localPixelId}
            onChange={(e) => setLocalPixelId(e.target.value)}
            placeholder="123456789012345"
            disabled={isLocked}
            inputMode="numeric"
            aria-invalid={pixelIdInvalid}
          />
          {pixelIdInvalid ? (
            <p className="text-xs text-destructive">
              El ID son solo números (15-16 dígitos). Copialo del Administrador
              de eventos de Meta.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Meta → Administrador de eventos → Orígenes de datos. Es el número
              que aparece debajo del nombre del píxel.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="meta-capi-token">Token de la API de conversiones</Label>
            {tokenSaved && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <ShieldCheck className="h-3 w-3" />
                Configurado
              </span>
            )}
          </div>
          <Input
            id="meta-capi-token"
            type="password"
            value={localToken}
            onChange={(e) => setLocalToken(e.target.value)}
            placeholder={tokenSaved ? "Guardado — escribí uno nuevo para reemplazarlo" : "EAAG..."}
            disabled={isLocked}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Sin este token se pierden entre 20% y 40% de las consultas, porque
            los bloqueadores de anuncios y Safari frenan la medición del
            navegador. Con el token, la consulta se registra desde el servidor y
            no la bloquea nadie.
          </p>
          {tokenSaved && !isLocked && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-destructive hover:bg-transparent hover:underline"
              onClick={() => setConfirmRemoveToken(true)}
            >
              Quitar token guardado
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta-test-code">Código de evento de prueba</Label>
          <Input
            id="meta-test-code"
            value={localTestCode}
            onChange={(e) => setLocalTestCode(e.target.value)}
            placeholder="TEST12345"
            disabled={isLocked}
          />
          <p className="text-xs text-muted-foreground">
            Solo para verificar la instalación desde &ldquo;Eventos de
            prueba&rdquo;. <strong>Dejalo vacío en producción</strong>: con un
            código cargado, Meta trata los eventos como prueba y no cuentan
            como conversiones reales.
          </p>
        </div>

        <div className="flex justify-end pt-1">
          <Button onClick={handleSave} disabled={loading || isLocked || pixelIdInvalid}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmRemoveToken}
        onOpenChange={(open) => !open && setConfirmRemoveToken(false)}
        title="Quitar el token de conversiones"
        description="Se va a seguir midiendo desde el navegador, pero vas a perder las consultas de visitantes con bloqueador de anuncios. Podés volver a cargarlo cuando quieras."
        confirmLabel="Quitar token"
        destructive
        onConfirm={handleRemoveToken}
      />
    </Card>
  );
}
