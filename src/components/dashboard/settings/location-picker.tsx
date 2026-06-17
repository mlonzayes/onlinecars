"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { MapPin, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Leaflet toca window → carga client-only (sin SSR). Mientras carga, un skeleton.
const MapPicker = dynamic(() => import("./map-picker"), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded-lg bg-muted" />,
});

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
}

// Selector de ubicación directo sobre el mapa: el dealer clickea su punto o
// arrastra el pin. Sin buscador — la persona marca exactamente dónde está su
// local. Guardamos las coords; la visibilidad del mapa la maneja el toggle
// "Mostrar mapa" de la sección Contacto del sitio.
export function LocationPicker({ latitude, longitude }: LocationPickerProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    latitude !== null && longitude !== null ? { lat: latitude, lng: longitude } : null
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/concesionario", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
          // Sin buscador no hay label geocodificado; el caption del sitio usa la
          // dirección de contacto. Limpiamos cualquier label viejo.
          mapLabel: null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al guardar");
        return;
      }
      toast.success("Ubicación actualizada");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Ubicación en el mapa
        </CardTitle>
        <CardDescription>
          Clickeá en el mapa para marcar dónde está tu local, o arrastrá el pin para ajustarlo.
          Para mostrarlo en tu sitio, activá &ldquo;Mostrar mapa&rdquo; en la sección Contacto.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Estado de la ubicación */}
        {coords ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm">
            <span className="flex items-center gap-2 text-emerald-900">
              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              Ubicación marcada
            </span>
            <button
              type="button"
              onClick={() => setCoords(null)}
              className="shrink-0 text-emerald-700 hover:text-emerald-900"
              aria-label="Quitar ubicación"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <p className="rounded-lg border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
            Todavía no marcaste tu ubicación. Clickeá en el mapa para ponerla.
          </p>
        )}

        <div className="overflow-hidden rounded-lg border">
          <MapPicker
            latitude={coords?.lat ?? null}
            longitude={coords?.lng ?? null}
            onChange={(lat, lng) => setCoords({ lat, lng })}
          />
        </div>

        <div className="flex justify-end pt-1">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
