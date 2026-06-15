"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AcceptTermsForm() {
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    if (!accepted) {
      setError(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/terms/accept", { method: "POST" });
      if (!res.ok) throw new Error();
      // Navegación dura: el gate del dashboard re-evalúa fresco con la aceptación ya registrada.
      window.location.href = "/dashboard";
    } catch {
      toast.error("No se pudo registrar la aceptación. Intentá de nuevo.");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actualizamos nuestros términos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Actualizamos los Términos y Condiciones y la Política de Privacidad. Para seguir
          usando motorflow, revisalos y aceptá la nueva versión.
        </p>

        <div className="space-y-1.5">
          <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => {
                setAccepted(e.target.checked);
                if (e.target.checked) setError(false);
              }}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer"
            />
            <span>
              Acepto los{" "}
              <a href="/terminos" target="_blank" className="text-blue-600 underline underline-offset-2">
                Términos y Condiciones
              </a>{" "}
              y la{" "}
              <a href="/privacidad" target="_blank" className="text-blue-600 underline underline-offset-2">
                Política de Privacidad
              </a>.
            </span>
          </label>
          {error && (
            <p className="text-sm text-destructive">
              Tenés que aceptar para continuar.
            </p>
          )}
        </div>

        <Button onClick={handleAccept} className="w-full" disabled={loading}>
          {loading ? "Guardando..." : "Aceptar y continuar"}
        </Button>
      </CardContent>
    </Card>
  );
}
