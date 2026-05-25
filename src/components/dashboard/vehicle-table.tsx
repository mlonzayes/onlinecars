"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Car, Eye, EyeOff, Loader2, MoreHorizontal, Pencil, Star, Trash2, ShoppingBag, Lock, ChevronDown, CheckCircle2, CircleDot } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import type { VehicleImage } from "@prisma/client";
import type { PlanLimits } from "@/lib/plans";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// Versión serializada: price como string, fechas como string
export interface SerializedVehicleRow {
  id: string;
  dealershipId: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: string;
  currency: string;
  kilometers: number | null;
  fuelType: string | null;
  transmission: string | null;
  color: string | null;
  doors: number | null;
  engine: string | null;
  licensePlate: string | null;
  description: string | null;
  condition: string;
  status: string;
  featured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  images: VehicleImage[];
}

interface VehicleTableProps {
  vehicles: SerializedVehicleRow[];
  limits: PlanLimits;
}

const STATUS_LABELS: Record<string, string> = {
  available: "Disponible",
  reserved: "Reservado",
  sold: "Vendido",
};

const TOAST_DURATION = 2000;

// Acciones masivas que requieren confirmación (destructivas o semi-destructivas).
// Las toggle (publish/featured) ejecutan directo sin ConfirmDialog.
type ConfirmableBulkAction =
  | { kind: "delete" }
  | { kind: "status"; status: "available" | "reserved" | "sold" };

const STATUS_BULK_LABEL: Record<string, string> = {
  available: "Disponible",
  reserved: "Reservado",
  sold: "Vendido",
};

export function VehicleTable({ vehicles, limits }: VehicleTableProps) {
  const router = useRouter();
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // Acción bulk pendiente de confirmar. null = sin confirmación abierta.
  const [pendingBulk, setPendingBulk] = useState<ConfirmableBulkAction | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const isAllSelected = selectedIds.size > 0 && selectedIds.size === vehicles.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < vehicles.length;

  function setLoading(id: string, loading: boolean) {
    setLoadingIds((prev) => {
      const next = new Set(prev);
      loading ? next.add(id) : next.delete(id);
      return next;
    });
  }

  async function handlePublishToggle(id: string, isPublished: boolean) {
    setLoading(id, true);
    try {
      const res = await fetch(`/api/vehiculos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishedAt: isPublished ? null : new Date().toISOString() }),
      });
      if (!res.ok) throw new Error();
      toast.success(isPublished ? "Vehículo despublicado" : "Vehículo publicado", { duration: TOAST_DURATION });
      router.refresh();
    } catch {
      toast.error("Error al cambiar la publicación", { duration: TOAST_DURATION });
    } finally {
      setLoading(id, false);
    }
  }

  async function handleFeaturedToggle(id: string, featured: boolean) {
    setLoading(id, true);
    try {
      const res = await fetch(`/api/vehiculos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !featured }),
      });
      if (!res.ok) throw new Error();
      toast.success(featured ? "Destaque removido" : "Vehículo destacado", { duration: TOAST_DURATION });
      router.refresh();
    } catch {
      toast.error("Error al cambiar el destaque", { duration: TOAST_DURATION });
    } finally {
      setLoading(id, false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setLoading(id, true);
    try {
      const res = await fetch(`/api/vehiculos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Vehículo eliminado", { duration: TOAST_DURATION });
      router.refresh();
    } catch {
      toast.error("Error al eliminar el vehículo", { duration: TOAST_DURATION });
    } finally {
      setLoading(id, false);
      setConfirmDeleteId(null);
    }
  }

  // Llama a POST /api/vehiculos/bulk con la acción que corresponda.
  // Centralizamos acá el manejo de loading + toast + refresh + cleanup
  // así cada acción específica solo arma el body.
  async function callBulk(body: Record<string, unknown>, successCopy: (ok: number) => string) {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/vehiculos/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, ids: Array.from(selectedIds) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Error al ejecutar la acción", { duration: TOAST_DURATION });
        return;
      }
      const ok: number = data.ok ?? 0;
      const blocked: Array<{ title: string; reason: string }> = data.blocked ?? [];

      if (ok > 0) toast.success(successCopy(ok), { duration: TOAST_DURATION });
      if (blocked.length > 0) {
        // Mostramos las primeras 3 razones para no inundar el toast.
        const preview = blocked.slice(0, 3).map((b) => `${b.title} (${b.reason})`).join(", ");
        const more = blocked.length > 3 ? ` y ${blocked.length - 3} más` : "";
        toast.error(`${blocked.length} bloqueados: ${preview}${more}`, { duration: 6000 });
      }
      if (ok === 0 && blocked.length === 0) {
        toast.message("Sin cambios", { duration: TOAST_DURATION });
      }

      setSelectedIds(new Set());
      router.refresh();
    } catch {
      toast.error("Error de conexión", { duration: TOAST_DURATION });
    } finally {
      setBulkLoading(false);
      setPendingBulk(null);
    }
  }

  function handleBulkConfirmed() {
    if (!pendingBulk) return;
    if (pendingBulk.kind === "delete") {
      void callBulk({ action: "delete" }, (n) => `${n} vehículos eliminados`);
    } else if (pendingBulk.kind === "status") {
      const label = STATUS_BULK_LABEL[pendingBulk.status];
      void callBulk(
        { action: "status", status: pendingBulk.status },
        (n) => `${n} vehículos marcados como ${label}`
      );
    }
  }

  function handleBulkPublish(value: boolean) {
    void callBulk(
      { action: "publish", value },
      (n) => (value ? `${n} vehículos publicados` : `${n} vehículos despublicados`)
    );
  }

  function handleBulkFeatured(value: boolean) {
    void callBulk(
      { action: "featured", value },
      (n) => (value ? `${n} vehículos destacados` : `${n} sin destaque`)
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <Car className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="font-medium text-muted-foreground">No tenés vehículos cargados</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Agregá tu primer vehículo para empezar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">{selectedIds.size} seleccionados</span>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium hover:bg-accent disabled:opacity-50"
                disabled={bulkLoading}
              >
                {bulkLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
                Acciones
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Status group */}
                <DropdownMenuItem onClick={() => setPendingBulk({ kind: "status", status: "available" })}>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                  Marcar Disponible
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPendingBulk({ kind: "status", status: "reserved" })}>
                  <CircleDot className="mr-2 h-4 w-4 text-amber-600" />
                  Marcar Reservado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPendingBulk({ kind: "status", status: "sold" })}>
                  <CircleDot className="mr-2 h-4 w-4 text-red-600" />
                  Marcar Vendido
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Toggle group — sin confirmación, son reversibles */}
                <DropdownMenuItem onClick={() => handleBulkPublish(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Publicar en web
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkPublish(false)}>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Despublicar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkFeatured(true)}>
                  <Star className="mr-2 h-4 w-4" />
                  Destacar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkFeatured(false)}>
                  <Star className="mr-2 h-4 w-4 text-muted-foreground" />
                  Quitar destaque
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => setPendingBulk({ kind: "delete" })}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar seleccionados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
      
      <div className="rounded-lg border">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px] px-4">
              <Checkbox
                checked={isAllSelected}
                indeterminate={isSomeSelected}
                onCheckedChange={(checked) => {
                  if (!limits.allowBulkActions) {
                    return toast("Mejorá tu plan", { description: "Las acciones masivas están disponibles a partir del plan Media." });
                  }
                  if (checked) {
                    setSelectedIds(new Set(vehicles.map((v) => v.id)));
                  } else {
                    setSelectedIds(new Set());
                  }
                }}
              />
            </TableHead>
            <TableHead className="w-[56px]" />
            <TableHead>Vehículo</TableHead>
            <TableHead>Condición</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Publicación</TableHead>
            <TableHead className="w-[40px]">Dest.</TableHead>
            <TableHead className="w-[40px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => {
            const primaryImage = vehicle.images[0];
            const isPublished = vehicle.publishedAt !== null;

            return (
              <TableRow key={vehicle.id} className={selectedIds.has(vehicle.id) ? "bg-muted/50" : ""}>
                {/* Checkbox */}
                <TableCell className="px-4">
                  <Checkbox 
                    checked={selectedIds.has(vehicle.id)}
                    onCheckedChange={(checked) => {
                      if (!limits.allowBulkActions) {
                        return toast("Mejorá tu plan", { description: "Las acciones masivas están disponibles a partir del plan Media." });
                      }
                      const next = new Set(selectedIds);
                      if (checked) next.add(vehicle.id);
                      else next.delete(vehicle.id);
                      setSelectedIds(next);
                    }}
                  />
                </TableCell>
                
                {/* Imagen */}
                <TableCell>
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-muted">
                    {primaryImage ? (
                      <Image
                        src={primaryImage.url}
                        alt={primaryImage.alt ?? vehicle.title}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Car className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>

                {/* Título */}
                <TableCell>
                  <p className="font-medium leading-tight">{vehicle.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {vehicle.brand} {vehicle.model} · {vehicle.year}
                    {vehicle.licensePlate && (
                      <>
                        {" · "}
                        <span className="font-mono uppercase tracking-wider text-foreground/80">
                          {vehicle.licensePlate}
                        </span>
                      </>
                    )}
                  </p>
                </TableCell>

                {/* Condición */}
                <TableCell>
                  <Badge
                    className={cn(
                      "text-xs",
                      vehicle.condition === "new"
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-100",
                    )}
                  >
                    {vehicle.condition === "new" ? "0km" : "Usado"}
                  </Badge>
                </TableCell>

                {/* Precio */}
                <TableCell className="font-medium">
                  {formatCurrency(vehicle.price, vehicle.currency)}
                </TableCell>

                {/* Estado */}
                <TableCell>
                  <Badge
                    className={cn(
                      "text-xs",
                      vehicle.status === "available" &&
                        "bg-green-100 text-green-800 hover:bg-green-100",
                      vehicle.status === "reserved" &&
                        "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
                      vehicle.status === "sold" && "bg-red-100 text-red-800 hover:bg-red-100",
                    )}
                  >
                    {STATUS_LABELS[vehicle.status] ?? vehicle.status}
                  </Badge>
                </TableCell>

                {/* Publicado */}
                <TableCell>
                  <Badge
                    className={cn(
                      "text-xs",
                      isPublished
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-100",
                    )}
                  >
                    {isPublished ? "Publicado" : "Borrador"}
                  </Badge>
                </TableCell>

                {/* Destacado */}
                <TableCell>
                  <Star
                    className={cn(
                      "h-4 w-4",
                      vehicle.featured
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground",
                    )}
                  />
                </TableCell>

                {/* Acciones */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm hover:bg-muted outline-none disabled:opacity-50"
                      disabled={loadingIds.has(vehicle.id)}
                    >
                      {loadingIds.has(vehicle.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                      <span className="sr-only">Acciones</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        render={<Link href={`/dashboard/vehiculos/${vehicle.id}`} />}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handlePublishToggle(vehicle.id, isPublished)}
                      >
                        {isPublished ? (
                          <><EyeOff className="mr-2 h-4 w-4" /> Despublicar</>
                        ) : (
                          <><Eye className="mr-2 h-4 w-4" /> Publicar en Web</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (!limits.allowMLIntegration) {
                            return toast("Mejorá tu plan", { description: "Publicar en Mercado Libre requiere el plan Media o Premium." });
                          }
                          // Optimistic update redirect
                          router.push(`/dashboard/vehiculos/${vehicle.id}#ml`);
                        }}
                      >
                        {limits.allowMLIntegration ? (
                          <ShoppingBag className="mr-2 h-4 w-4" />
                        ) : (
                          <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                        )}
                        Publicar en ML
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleFeaturedToggle(vehicle.id, vehicle.featured)}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        {vehicle.featured ? "Quitar destaque" : "Destacar"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => setConfirmDeleteId(vehicle.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Eliminar vehículo"
        description="Esta acción no se puede deshacer. Se eliminarán también todas sus imágenes."
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleDeleteConfirmed}
      />

      <ConfirmDialog
        open={pendingBulk !== null}
        onOpenChange={(open) => !open && setPendingBulk(null)}
        title={
          pendingBulk?.kind === "delete"
            ? "Eliminar vehículos seleccionados"
            : pendingBulk?.kind === "status"
            ? `Marcar ${selectedIds.size} como ${STATUS_BULK_LABEL[pendingBulk.status]}`
            : "Confirmar acción"
        }
        description={
          pendingBulk?.kind === "delete"
            ? `Se van a eliminar ${selectedIds.size} vehículos. Esta acción no se puede deshacer. Los que tengan ventas activas se reportarán pero no se borrarán.`
            : pendingBulk?.kind === "status"
            ? `Se va a cambiar el estado de ${selectedIds.size} vehículos a "${STATUS_BULK_LABEL[pendingBulk.status]}". Verificá la selección antes de confirmar.`
            : ""
        }
        confirmLabel={pendingBulk?.kind === "delete" ? "Eliminar" : "Aplicar"}
        destructive={pendingBulk?.kind === "delete" || (pendingBulk?.kind === "status" && pendingBulk.status === "sold")}
        onConfirm={handleBulkConfirmed}
      />
    </div>
  );
}
