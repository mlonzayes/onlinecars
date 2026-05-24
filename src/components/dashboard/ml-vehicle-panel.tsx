"use client";

/**
 * Panel de Mercado Libre en el detalle de un vehículo.
 * Muestra el estado de la publicación y permite publicar, pausar, reactivar o cerrar.
 */
import { useState } from "react";
import {
  ExternalLink,
  ShoppingBag,
  PauseCircle,
  PlayCircle,
  XCircle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

// Opciones válidas de listing_type_id para vehículos clasificados en MLA.
const LISTING_TYPE_OPTIONS = [
  { value: "silver", label: "Silver — básico" },
  { value: "gold", label: "Gold — standard" },
  { value: "gold_pro", label: "Gold Pro — profesional" },
  { value: "gold_premium", label: "Gold Premium — máxima visibilidad" },
] as const;

type ListingTypeId = (typeof LISTING_TYPE_OPTIONS)[number]["value"];

export type MLListingStatus =
  | "active"
  | "paused"
  | "closed"
  | "error"
  | "payment_required";

interface MLListing {
  id: string;
  mlItemId: string;
  status: MLListingStatus;
  permalink: string | null;
  listingTypeId: string;
  lastSyncedAt: string | null;
  errorMessage: string | null;
}

interface Props {
  vehicleId: string;
  initialListing: MLListing | null;
  // false si no hay cuenta ML conectada
  hasMLAccount: boolean;
}

const STATUS_CONFIG: Record<
  MLListingStatus,
  { label: string; className: string; Icon: React.ElementType }
> = {
  active: {
    label: "Publicado",
    className: "text-green-600 dark:text-green-400",
    Icon: CheckCircle2,
  },
  paused: {
    label: "Pausado",
    className: "text-amber-600 dark:text-amber-400",
    Icon: PauseCircle,
  },
  closed: {
    label: "Cerrado",
    className: "text-muted-foreground",
    Icon: XCircle,
  },
  error: {
    label: "Error",
    className: "text-destructive",
    Icon: AlertCircle,
  },
  payment_required: {
    label: "Pendiente de pago",
    className: "text-amber-600 dark:text-amber-400",
    Icon: Wallet,
  },
};

export function MLVehiclePanel({ vehicleId, initialListing, hasMLAccount }: Props) {
  const [listing, setListing] = useState<MLListing | null>(initialListing);
  const [publishing, setPublishing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedListingType, setSelectedListingType] = useState<ListingTypeId>("silver");

  const statusConfig = listing ? STATUS_CONFIG[listing.status] : null;

  async function handlePublish() {
    setPublishing(true);
    try {
      const res = await fetch(`/api/vehiculos/${vehicleId}/ml`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingTypeId: selectedListingType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error publicando");
      setListing(data.listing);

      // Abrir ML en una pestaña nueva para que el usuario complete el pago
      // (si aplica) o vea su publicación recién creada.
      if (data.listing?.permalink) {
        window.open(data.listing.permalink, "_blank", "noopener,noreferrer");
      }

      if (data.paymentRequired) {
        toast.success("Publicación creada en Mercado Libre — pendiente de pago");
      } else {
        toast.success("Vehículo publicado en Mercado Libre");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al publicar");
    } finally {
      setPublishing(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch(`/api/vehiculos/${vehicleId}/ml/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error sincronizando");
      setListing(data.listing);
      if (data.changed) {
        toast.success(`Estado actualizado: ${STATUS_CONFIG[data.listing.status as MLListingStatus]?.label ?? data.listing.status}`);
      } else {
        toast.message("Sin cambios desde Mercado Libre");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al sincronizar");
    } finally {
      setSyncing(false);
    }
  }

  async function handleAction(action: "pause" | "reactivate" | "close") {
    setActionLoading(true);
    try {
      if (action === "close") {
        const res = await fetch(`/api/vehiculos/${vehicleId}/ml`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Error cerrando");
        if (data.discardedUnpaid) {
          // Listing payment_required: ML no permite cerrarlo, lo borramos solo de DB.
          setListing(null);
          toast.success("Publicación descartada (no se llegó a pagar)");
        } else {
          setListing((prev) => prev ? { ...prev, status: "closed" } : null);
          toast.success("Publicación cerrada en Mercado Libre");
        }
      } else {
        const res = await fetch(`/api/vehiculos/${vehicleId}/ml`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Error actualizando");
        setListing(data.listing);
        toast.success(
          action === "pause" ? "Publicación pausada" : "Publicación reactivada"
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#FFE600] flex items-center justify-center shrink-0 overflow-hidden p-1">
          <Image 
            src="/logo/meli.png" 
            alt="Mercado Libre" 
            width={32} 
            height={32} 
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Mercado Libre</h3>
          {statusConfig && listing ? (
            <div className={`flex items-center gap-1 text-xs ${statusConfig.className}`}>
              <statusConfig.Icon className="h-3 w-3" />
              {statusConfig.label}
              {listing.mlItemId && (
                <span className="text-muted-foreground ml-1">· {listing.mlItemId}</span>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No publicado</p>
          )}
        </div>
      </div>

      {/* Mensaje de error */}
      {listing?.status === "error" && listing.errorMessage && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
          {listing.errorMessage}
        </div>
      )}

      {/* Callout: pago pendiente */}
      {listing?.status === "payment_required" && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          La publicación está creada en Mercado Libre pero <strong>requiere pago</strong> para activarse.
          Entrá a Mercado Libre para completarlo.
        </div>
      )}

      {/* Link a la publicación — visible para active y payment_required */}
      {listing &&
        (listing.status === "active" || listing.status === "payment_required") &&
        listing.permalink && (
          <a
            href={listing.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            Ver en Mercado Libre
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

      {/* Sin cuenta ML */}
      {!hasMLAccount && (
        <p className="text-xs text-muted-foreground">
          Conectá tu cuenta de ML en{" "}
          <a href="/dashboard/portales" className="text-primary hover:underline">
            Portales
          </a>{" "}
          para publicar este vehículo.
        </p>
      )}

      {/* Selector de tipo de publicación — solo visible cuando se va a publicar */}
      {hasMLAccount && (!listing || listing.status === "closed") && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground" htmlFor="ml-listing-type">
            Tipo de publicación
          </label>
          <select
            id="ml-listing-type"
            value={selectedListingType}
            onChange={(e) => setSelectedListingType(e.target.value as ListingTypeId)}
            disabled={publishing}
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs disabled:opacity-50"
          >
            {LISTING_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Todos los tipos en MLA requieren pago. La diferencia está en visibilidad y duración.
          </p>
        </div>
      )}

      {/* Acciones */}
      {hasMLAccount && (
        <div className="flex flex-wrap gap-2 pt-1">
          {/* Publicar (si no hay listing activo) */}
          {(!listing || listing.status === "closed") && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFE600] hover:bg-[#f0d800] text-[#333] font-semibold px-3 py-1.5 text-xs transition-colors disabled:opacity-60"
            >
              {publishing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ShoppingBag className="h-3 w-3" />
              )}
              {publishing ? "Publicando…" : "Publicar en ML"}
            </button>
          )}

          {/* Sincronizar — visible si hay listing no cerrado */}
          {listing && listing.status !== "closed" && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background hover:bg-accent px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60"
            >
              {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Sincronizar
            </button>
          )}

          {/* Pausar */}
          {listing?.status === "active" && (
            <button
              onClick={() => handleAction("pause")}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background hover:bg-accent px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60"
            >
              {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <PauseCircle className="h-3 w-3" />}
              Pausar
            </button>
          )}

          {/* Reactivar */}
          {listing?.status === "paused" && (
            <button
              onClick={() => handleAction("reactivate")}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background hover:bg-accent px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60"
            >
              {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlayCircle className="h-3 w-3" />}
              Reactivar
            </button>
          )}

          {/* Cerrar / Descartar */}
          {listing && listing.status !== "closed" && (
            <button
              onClick={() => handleAction("close")}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-background hover:bg-destructive/10 text-destructive px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60"
            >
              {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
              {listing.status === "payment_required" ? "Descartar publicación" : "Cerrar publicación"}
            </button>
          )}
        </div>
      )}

      {/* Última sync */}
      {listing?.lastSyncedAt && (
        <p className="text-xs text-muted-foreground pt-1">
          Última sincronización: {new Date(listing.lastSyncedAt).toLocaleString("es-AR")}
        </p>
      )}
    </div>
  );
}
