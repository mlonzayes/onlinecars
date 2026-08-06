"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldAlert, LogOut, Loader2 } from "lucide-react";

interface PlatformEditBannerProps {
  dealershipName: string;
  slug: string;
}

/**
 * Banner fijo del modo plataforma. Va SIEMPRE visible mientras estés editando el
 * sitio de un cliente — sin esto, un descuido te hace publicar cambios en la
 * cuenta equivocada y enterarte cuando te llama el dealer.
 *
 * Sticky y no `fixed`: dentro del flujo del documento, así no tapa contenido al
 * final de la página ni pelea con el scroll del editor.
 */
export function PlatformEditBanner({ dealershipName, slug }: PlatformEditBannerProps) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function handleExit() {
    setLeaving(true);
    try {
      const res = await fetch("/api/admin/impersonation", { method: "DELETE" });
      if (!res.ok) throw new Error();
      // refresh antes del push: fuerza a los Server Components a re-resolver el
      // contexto ya sin la cookie. Sin esto podés volver a /admin/sitios con la
      // pantalla vieja cacheada y creer que seguís adentro.
      router.refresh();
      router.push("/admin/sitios");
    } catch {
      setLeaving(false);
      toast.error("No se pudo salir del modo plataforma");
    }
  }

  return (
    <div className="sticky top-0 z-50 -mx-6 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-violet-500/30 bg-violet-700 px-6 py-3 text-white">
      <div className="flex min-w-0 items-center gap-2.5">
        <ShieldAlert className="h-5 w-5 shrink-0" />
        <p className="min-w-0 text-sm">
          <span className="font-semibold">Modo plataforma</span> — estás editando el
          sitio de <span className="font-semibold">{dealershipName}</span>{" "}
          <span className="font-mono text-xs opacity-75">({slug})</span>. Los cambios
          se publican en su sitio.
        </p>
      </div>
      <button
        type="button"
        onClick={handleExit}
        disabled={leaving}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-white/15 px-3 py-1.5 text-sm font-medium transition hover:bg-white/25 disabled:opacity-60"
      >
        {leaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
        Salir del modo
      </button>
    </div>
  );
}
