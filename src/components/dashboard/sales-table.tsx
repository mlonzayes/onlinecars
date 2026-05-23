"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  Loader2,
  MoreHorizontal,
  ShoppingCart,
  Trash2,
  XCircle,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn, formatCurrency } from "@/lib/utils";
import type { PlanLimits } from "@/lib/plans";

export type SalesStatusFilter = "all" | "active" | "completed" | "cancelled";

export interface SaleRow {
  id: string;
  status: string;
  salePrice: string;
  currency: string;
  createdAt: string;
  customer: {
    id: string;
    type: string;
    firstName: string;
    lastName: string | null;
    businessName: string | null;
    documentType: string;
    documentNumber: string;
  };
  vehicle: {
    id: string;
    title: string;
    brand: string;
    model: string;
    year: number;
    licensePlate: string | null;
  };
}

interface SalesTableProps {
  sales: SaleRow[];
  statusFilter: SalesStatusFilter;
  searchActive: boolean;
  limits: PlanLimits;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  reserved: "Reservado",
  in_progress: "En curso",
  completed: "Completado",
  cancelled: "Cancelado",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  reserved: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  in_progress: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  completed: "bg-green-100 text-green-800 hover:bg-green-100",
  cancelled: "bg-red-100 text-red-700 hover:bg-red-100",
};

const TOAST_DURATION = 2500;
const UPGRADE_TOAST_TITLE = "Mejorá tu plan";
const UPGRADE_TOAST_DESC =
  "Las acciones masivas están disponibles a partir del plan Media.";

function customerNameOf(c: SaleRow["customer"]): string {
  if (c.type === "company") return c.businessName ?? c.firstName;
  return [c.firstName, c.lastName].filter(Boolean).join(" ");
}

export function SalesTable({
  sales,
  statusFilter,
  searchActive,
  limits,
}: SalesTableProps) {
  const router = useRouter();

  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmBulkCancel, setConfirmBulkCancel] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // ─── Selección masiva ────────────────────────────────────────────────────

  function setLoading(id: string, loading: boolean) {
    setLoadingIds((prev) => {
      const next = new Set(prev);
      if (loading) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSelect(id: string) {
    if (!limits.allowBulkActions) {
      toast(UPGRADE_TOAST_TITLE, { description: UPGRADE_TOAST_DESC });
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (!limits.allowBulkActions) {
      toast(UPGRADE_TOAST_TITLE, { description: UPGRADE_TOAST_DESC });
      return;
    }
    setSelectedIds((prev) => {
      const visibleIds = sales.map((s) => s.id);
      const allSelected = visibleIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  const visibleSelectedCount = sales.filter((s) => selectedIds.has(s.id)).length;
  const allVisibleSelected =
    sales.length > 0 && visibleSelectedCount === sales.length;
  const someVisibleSelected =
    visibleSelectedCount > 0 && visibleSelectedCount < sales.length;
  const selectedCount = selectedIds.size;

  // ─── Acciones individuales ───────────────────────────────────────────────

  function handleDelete(id: string) {
    setConfirmDeleteId(id);
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setLoading(id, true);
    try {
      const res = await fetch(`/api/ventas/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al eliminar la venta", {
          duration: TOAST_DURATION,
        });
        return;
      }
      toast.success("Venta eliminada", { duration: TOAST_DURATION });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      router.refresh();
    } finally {
      setLoading(id, false);
    }
  }

  // ─── Bulk: cancelar ──────────────────────────────────────────────────────

  async function bulkCancel() {
    if (selectedCount === 0) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/ventas/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "cancelled",
              cancelReason: "Cancelada en lote desde el dashboard",
            }),
          })
        )
      );
      // Algunas pueden fallar porque ya estaban en "completed" o "cancelled"
      // (transición inválida) — el backend devuelve 422. Las contamos aparte.
      const failed = results.filter(
        (r) =>
          r.status === "rejected" ||
          (r.status === "fulfilled" && !r.value.ok)
      ).length;
      const ok = ids.length - failed;

      if (ok > 0) {
        toast.success(
          ok === 1 ? "Venta cancelada" : `${ok} ventas canceladas`,
          { duration: TOAST_DURATION }
        );
      }
      if (failed > 0) {
        toast.error(
          `${failed} ${failed === 1 ? "venta no se pudo" : "ventas no se pudieron"} cancelar (transición no permitida)`,
          { duration: TOAST_DURATION }
        );
      }
      clearSelection();
      router.refresh();
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar de bulk actions — aparece solo cuando hay seleccionados */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium">
              {selectedCount} {selectedCount === 1 ? "seleccionada" : "seleccionadas"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              disabled={bulkLoading}
              className="h-7 text-xs"
            >
              Limpiar selección
            </Button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmBulkCancel(true)}
            disabled={bulkLoading}
          >
            {bulkLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Cancelar venta
          </Button>
        </div>
      )}

      {sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <ShoppingCart className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium text-muted-foreground">
            {searchActive
              ? "Sin resultados para esta búsqueda"
              : statusFilter === "all"
                ? "No tenés ventas registradas"
                : "No hay ventas en esta categoría"}
          </p>
          {!searchActive && statusFilter === "all" && (
            <p className="mt-1 text-sm text-muted-foreground">
              Creá tu primera venta para empezar.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px] px-4">
                  <Checkbox
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Seleccionar todas las ventas visibles"
                  />
                </TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => {
                const customerName = customerNameOf(sale.customer);
                const isSelected = selectedIds.has(sale.id);
                const isLoading = loadingIds.has(sale.id);

                return (
                  <TableRow
                    key={sale.id}
                    className={cn(isSelected && "bg-muted/40")}
                  >
                    <TableCell className="px-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(sale.id)}
                        aria-label={`Seleccionar venta de ${customerName}`}
                      />
                    </TableCell>

                    {/* Vehículo */}
                    <TableCell>
                      <p className="font-medium leading-tight">
                        {sale.vehicle.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sale.vehicle.brand} {sale.vehicle.model} ·{" "}
                        {sale.vehicle.year}
                        {sale.vehicle.licensePlate && (
                          <>
                            {" · "}
                            <span className="font-mono uppercase tracking-wider text-foreground/80">
                              {sale.vehicle.licensePlate}
                            </span>
                          </>
                        )}
                      </p>
                    </TableCell>

                    {/* Cliente */}
                    <TableCell>
                      <p className="font-medium leading-tight">{customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {sale.customer.documentType} {sale.customer.documentNumber}
                      </p>
                    </TableCell>

                    {/* Precio */}
                    <TableCell className="font-medium">
                      {formatCurrency(sale.salePrice, sale.currency)}
                    </TableCell>

                    {/* Estado */}
                    <TableCell>
                      <Badge
                        className={cn("text-xs", STATUS_STYLES[sale.status] ?? "")}
                      >
                        {STATUS_LABELS[sale.status] ?? sale.status}
                      </Badge>
                    </TableCell>

                    {/* Fecha */}
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </TableCell>

                    {/* Acciones */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm hover:bg-muted outline-none disabled:opacity-50"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                          <span className="sr-only">Acciones</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            render={
                              <Link href={`/dashboard/ventas/${sale.id}`} />
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalle
                          </DropdownMenuItem>
                          {(sale.status === "draft" ||
                            sale.status === "cancelled") && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDelete(sale.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Eliminar venta"
        description="Se va a eliminar la venta de forma permanente. Solo se pueden eliminar ventas en estado borrador o canceladas."
        confirmLabel="Eliminar"
        destructive
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={confirmBulkCancel}
        onOpenChange={setConfirmBulkCancel}
        title={
          selectedCount === 1
            ? "Cancelar venta"
            : `Cancelar ${selectedCount} ventas`
        }
        description="Las ventas se van a marcar como canceladas. Los vehículos asociados volverán a quedar disponibles. Las que ya estén completadas no se pueden cancelar — vas a ver el detalle en el toast."
        confirmLabel={selectedCount === 1 ? "Cancelar venta" : "Cancelar ventas"}
        cancelLabel="Volver"
        destructive
        onConfirm={bulkCancel}
      />
    </div>
  );
}
