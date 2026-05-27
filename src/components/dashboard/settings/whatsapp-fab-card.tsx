"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface WhatsappFabCardProps {
  // Estado actual del dealer
  enabled: boolean;
  message: string | null;
  hasWhatsappNumber: boolean;
  // Plan gating — viene del server
  allowWhatsappFab: boolean;
  currentPlan: string;
}

const DEFAULT_MESSAGE_PREVIEW = "Hola! Vi su sitio web y me gustaría consultar.";
const MAX_LENGTH = 280;

export function WhatsappFabCard({
  enabled,
  message,
  hasWhatsappNumber,
  allowWhatsappFab,
  currentPlan,
}: WhatsappFabCardProps) {
  const [localEnabled, setLocalEnabled] = useState(enabled);
  const [localMessage, setLocalMessage] = useState(message ?? "");
  const [loading, setLoading] = useState(false);

  // Si el plan no permite la feature, mostramos un estado "locked" con CTA de upgrade.
  const isLocked = !allowWhatsappFab;

  async function handleSave() {
    if (isLocked) return;
    setLoading(true);
    try {
      const res = await fetch("/api/concesionario", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappFabEnabled: localEnabled,
          whatsappMessage: localMessage.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al guardar");
        return;
      }
      toast.success("Configuración guardada");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  const charCount = localMessage.length;
  const overLimit = charCount > MAX_LENGTH;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-green-600" />
              Botón flotante de WhatsApp
            </CardTitle>
            <CardDescription>
              Activa un botón flotante en tu sitio público para que los clientes te escriban directo por WhatsApp.
            </CardDescription>
          </div>
          {isLocked && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
              <Sparkles className="h-3 w-3" />
              Plan Media o superior
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Estado del plan */}
        {isLocked && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium">Tu plan actual ({currentPlan}) no incluye esta feature.</p>
              <p className="mt-1 text-xs text-amber-800">
                Mejorá al plan Media o superior para activar el botón flotante y recibir consultas directas por WhatsApp.
              </p>
            </div>
          </div>
        )}

        {/* Aviso si no hay número cargado */}
        {!isLocked && !hasWhatsappNumber && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Cargá tu número de WhatsApp en los datos de contacto para que el botón funcione.
          </div>
        )}

        {/* Toggle de habilitar */}
        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Mostrar botón en mi sitio</p>
            <p className="text-xs text-muted-foreground">
              Visible siempre en la esquina inferior derecha.
            </p>
          </div>
          <input
            type="checkbox"
            checked={localEnabled}
            disabled={isLocked || !hasWhatsappNumber}
            onChange={(e) => setLocalEnabled(e.target.checked)}
            className="h-5 w-9 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>

        {/* Mensaje custom */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="whatsapp-message">Mensaje pre-cargado</Label>
            <span
              className={`text-xs ${overLimit ? "text-destructive" : "text-muted-foreground"}`}
            >
              {charCount}/{MAX_LENGTH}
            </span>
          </div>
          <Textarea
            id="whatsapp-message"
            value={localMessage}
            onChange={(e) => setLocalMessage(e.target.value)}
            placeholder={DEFAULT_MESSAGE_PREVIEW}
            rows={3}
            disabled={isLocked}
            maxLength={MAX_LENGTH + 50}
          />
          <p className="text-xs text-muted-foreground">
            Texto que se carga automáticamente cuando un visitante abre el chat. Vacío = usa el mensaje genérico.
          </p>
        </div>

        {/* Vista previa simulada */}
        {!isLocked && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Vista previa del mensaje
            </p>
            <p className="text-sm italic text-foreground">
              &ldquo;{localMessage.trim() || DEFAULT_MESSAGE_PREVIEW}&rdquo;
            </p>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button onClick={handleSave} disabled={loading || isLocked || overLimit}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
