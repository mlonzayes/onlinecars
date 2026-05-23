"use client";

/**
 * Tarjeta de integración con Mercado Libre en el dashboard de configuración.
 * - Muestra estado de conexión (conectado/desconectado)
 * - Botón conectar → inicia OAuth2 flow
 * - Botón desconectar → borra la cuenta ML
 * - Muestra nickname y fecha de conexión
 */
import { useState, useEffect, useRef } from "react";
import { ExternalLink, Link2, Link2Off, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export interface MLAccountStatus {
  connected: boolean;
  nickname?: string;
  mlUserId?: string;
  connectedAt?: string;
  tokenExpiresSoon?: boolean;
}

interface MLIntegrationCardProps {
  initialStatus: MLAccountStatus;
}

export function MLIntegrationCard({ initialStatus }: MLIntegrationCardProps) {
  const [status, setStatus] = useState<MLAccountStatus>(initialStatus);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const handledRef = useRef(false);

  // Leer query params del callback OAuth2 (post-redirect de ML)
  useEffect(() => {
    const connected = searchParams.get("ml_connected");
    const error = searchParams.get("ml_error");

    if (!connected && !error) return;
    if (handledRef.current) return;

    handledRef.current = true;

    if (connected === "1") {
      toast.success("Mercado Libre conectado exitosamente");
    } else if (error) {
      toast.error(`Error al conectar Mercado Libre: ${decodeURIComponent(error)}`);
    }

    // router.replace dispara re-render del Server Component, que trae el status fresco.
    router.replace(pathname);
  }, [searchParams, pathname, router]);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/mercadolibre/status", { method: "DELETE" });
      if (!res.ok) throw new Error("Error al desconectar");
      toast.success("Cuenta de Mercado Libre desconectada");
      setStatus({ connected: false });
    } catch {
      toast.error("No se pudo desconectar la cuenta");
    } finally {
      setDisconnecting(false);
    }
  }

  function handleConnect() {
    // Navega al endpoint que genera la URL de OAuth2 y redirige
    window.location.href = "/api/mercadolibre/auth";
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        {/* Logo ML */}
        <div className="w-12 h-12 rounded-xl bg-[#FFE600] flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1">
          <Image
            src="/logo/meli.png"
            alt="Mercado Libre"
            width={40}
            height={40}
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <h3 className="font-semibold text-base">Mercado Libre</h3>
          <p className="text-sm text-muted-foreground">
            Publicá tus vehículos directamente en tu cuenta de Mercado Libre
          </p>
        </div>
      </div>

      {/* Estado */}
      {status.connected ? (
        <ConnectedState
          status={status}
          onDisconnect={() => setConfirmOpen(true)}
          disconnecting={disconnecting}
        />
      ) : (
        <DisconnectedState onConnect={handleConnect} />
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Desconectar Mercado Libre"
        description="Se eliminarán todos los datos de integración. Vas a tener que volver a autorizar la app si querés reconectar más adelante."
        confirmLabel="Desconectar"
        destructive
        onConfirm={handleDisconnect}
      />
    </div>
  );
}

function ConnectedState({
  status,
  onDisconnect,
  disconnecting,
}: {
  status: MLAccountStatus;
  onDisconnect: () => void;
  disconnecting: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Badge conectado */}
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
        <span className="text-green-600 dark:text-green-400 font-medium">Conectado</span>
        {status.nickname && (
          <span className="text-muted-foreground">como <strong>{status.nickname}</strong></span>
        )}
      </div>

      {/* Aviso si el token vence pronto */}
      {status.tokenExpiresSoon && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>El token de Mercado Libre vence pronto. Te recomendamos reconectar tu cuenta.</span>
        </div>
      )}

      {/* Fecha de conexión */}
      {status.connectedAt && (
        <p className="text-xs text-muted-foreground">
          Conectado el {new Date(status.connectedAt).toLocaleDateString("es-AR", {
            day: "numeric", month: "long", year: "numeric"
          })}
        </p>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-3 pt-1">
        <a
          href="https://www.mercadolibre.com.ar/anuncios/listado"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          Ver publicaciones en ML
          <ExternalLink className="h-3 w-3" />
        </a>
        <span className="text-border">·</span>
        <button
          onClick={onDisconnect}
          disabled={disconnecting}
          className="inline-flex items-center gap-1.5 text-sm text-destructive hover:underline disabled:opacity-50"
        >
          {disconnecting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Link2Off className="h-3 w-3" />
          )}
          Desconectar
        </button>
      </div>
    </div>
  );
}

function DisconnectedState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />
        No conectado
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Conectá tu cuenta de Mercado Libre para publicar vehículos con un clic desde el dashboard.
        Las preguntas de ML se convierten automáticamente en leads.
      </p>
      <button
        onClick={onConnect}
        className="inline-flex items-center gap-2 rounded-lg bg-[#FFE600] hover:bg-[#f0d800] text-[#333] font-semibold px-4 py-2 text-sm transition-colors"
      >
        <Link2 className="h-4 w-4" />
        Conectar
      </button>
    </div>
  );
}
