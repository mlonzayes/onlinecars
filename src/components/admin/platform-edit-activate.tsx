"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, PencilRuler } from "lucide-react";

interface PlatformEditActivateProps {
  dealershipId: string;
  dealershipName: string;
}

/**
 * Pantalla de activación del modo plataforma.
 *
 * Aparece cuando entrás directo a la URL del editor (link guardado, refresh
 * después de que venció la cookie de 2h) sin el modo activo. El modo se prende
 * desde un handler porque una page NO puede setear cookies durante el render.
 */
export function PlatformEditActivate({
  dealershipId,
  dealershipName,
}: PlatformEditActivateProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleActivate() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/impersonation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealershipId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "No se pudo activar el modo plataforma");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      toast.error("Error de conexión");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-dashed p-8 text-center">
      <PencilRuler className="mx-auto mb-4 h-8 w-8 text-violet-500" />
      <h2 className="mb-2 text-lg font-semibold">Editar el sitio de {dealershipName}</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Vas a entrar en modo plataforma. Todo lo que edites acá se publica en el
        sitio de este cliente, no en el tuyo.
      </p>
      <button
        type="button"
        onClick={handleActivate}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Activar modo plataforma
      </button>
    </div>
  );
}
