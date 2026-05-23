"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calculator,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { QuotationStatusBadge } from "./quotation-status-badge";
import { cn, formatCurrency } from "@/lib/utils";
import type {
  QuotationStatus,
  QuotationType,
} from "@/lib/constants";
import type { PlanLimits } from "@/lib/plans";

export interface QuotationRow {
  id: string;
  type: QuotationType;
  code: string;
  status: string;
  effectiveStatus: QuotationStatus;
  currency: string;
  validUntil: string;
  emittedAt: string;
  createdAt: string;
  saleClientName: string | null;
  saleTotalPrice: string | null;
  purchaseSellerName: string | null;
  purchaseOfferAmount: string | null;
  vehicle: {
    id: string;
    title: string;
    brand: string;
    model: string;
    year: number;
  } | null;
  lead: { id: string; name: string } | null;
}

interface QuotationsTableProps {
  rows: QuotationRow[];
  searchActive: boolean;
  limits: PlanLimits;
}

const TYPE_LABELS: Record<QuotationType, string> = {
  sale: "Venta",
  purchase: "Compra",
};

const TOAST_DURATION = 2500;
const UPGRADE_TOAST_TITLE = "Mejorá tu plan";
const UPGRADE_TOAST_DESC =
  "Las acciones masivas están disponibles a partir del plan Media.";

// Status persistidos en DB sobre los que el endpoint DELETE acepta operar.
// `accepted` queda fuera porque es operación cerrada (histórico).
const DELETABLE_STATUSES = new Set(["pending", "rejected"]);

export function QuotationsTable({
  rows,
  searchActive,
  limits,
}: QuotationsTableProps) {
  const router = useRouter();
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [confirmBulkReject, setConfirmBulkReject] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  function setLoading(id: string, loading: boolean) {
    setLoadingIds((prev) => {
      const next = new Set(prev);
      if (loading) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  // ─── Selección masiva ────────────────────────────────────────────────────

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
      const visibleIds = rows.map((r) => r.id);
      const allSelected = visibleIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  const visibleSelectedCount = rows.filter((r) => selectedIds.has(r.id)).length;
  const allVisibleSelected =
    rows.length > 0 && visibleSelectedCount === rows.length;
  const someVisibleSelected =
    visibleSelectedCount > 0 && visibleSelectedCount < rows.length;
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
      const res = await fetch(`/api/cotizaciones/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al eliminar la cotización", {
          duration: TOAST_DURATION,
        });
        return;
      }
      toast.success("Cotización eliminada", { duration: TOAST_DURATION });
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

  // ─── Bulk: eliminar ──────────────────────────────────────────────────────

  async function bulkDelete() {
    if (selectedCount === 0) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.allSettled(
        ids.map((id) => fetch(`/api/cotizaciones/${id}`, { method: "DELETE" }))
      );
      const failed = results.filter(
        (r) =>
          r.status === "rejected" ||
          (r.status === "fulfilled" && !r.value.ok)
      ).length;
      const ok = ids.length - failed;

      if (ok > 0) {
        toast.success(
          ok === 1 ? "Cotización eliminada" : `${ok} cotizaciones eliminadas`,
          { duration: TOAST_DURATION }
        );
      }
      if (failed > 0) {
        toast.error(
          `${failed} ${failed === 1 ? "cotización no se pudo" : "cotizaciones no se pudieron"} eliminar (las aceptadas son histórico y no se borran)`,
          { duration: TOAST_DURATION }
        );
      }
      clearSelection();
      router.refresh();
    } finally {
      setBulkLoading(false);
    }
  }

  // ─── Bulk: rechazar ──────────────────────────────────────────────────────

  async function bulkReject() {
    if (selectedCount === 0) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/cotizaciones/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "rejected" }),
          })
        )
      );
      const failed = results.filter(
        (r) =>
          r.status === "rejected" ||
          (r.status === "fulfilled" && !r.value.ok)
      ).length;
      const ok = ids.length - failed;

      if (ok > 0) {
        toast.success(
          ok === 1 ? "Cotización rechazada" : `${ok} cotizaciones rechazadas`,
          { duration: TOAST_DURATION }
        );
      }
      if (failed > 0) {
        toast.error(
          `${failed} ${failed === 1 ? "cotización no se pudo" : "cotizaciones no se pudieron"} rechazar (solo se pueden rechazar las pendientes vigentes)`,
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
      {/* Toolbar de bulk — aparece solo con seleccionadas */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium">
              {selectedCount}{" "}
              {selectedCount === 1 ? "seleccionada" : "seleccionadas"}
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmBulkReject(true)}
              disabled={bulkLoading}
            >
              {bulkLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Rechazar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmBulkDelete(true)}
              disabled={bulkLoading}
            >
              {bulkLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Eliminar
            </Button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Calculator className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium text-muted-foreground">
            {searchActive
              ? "No hay cotizaciones que coincidan con los filtros"
              : "No hay cotizaciones cargadas"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchActive
              ? "Ajustá los filtros o probá con otra búsqueda."
              : "Creá una cotización nueva para empezar."}
          </p>
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
                    aria-label="Seleccionar todas las cotizaciones visibles"
                  />
                </TableHead>
                <TableHead className="w-[120px]">Código</TableHead>
                <TableHead className="w-[80px]">Tipo</TableHead>
                <TableHead>Contraparte</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Válida hasta</TableHead>
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const counterpart =
                  row.type === "sale"
                    ? row.saleClientName
                    : row.purchaseSellerName;
                const amount =
                  row.type === "sale"
                    ? row.saleTotalPrice
                    : row.purchaseOfferAmount;
                const vehicleLabel =
                  row.type === "sale" && row.vehicle ? row.vehicle.title : "—";
                const vehicleMeta =
                  row.type === "sale" && row.vehicle
                    ? `${row.vehicle.brand} · ${row.vehicle.year}`
                    : null;
                const isLoading = loadingIds.has(row.id);
                const isSelected = selectedIds.has(row.id);
                const isDeletable = DELETABLE_STATUSES.has(row.status);

                return (
                  <TableRow
                    key={row.id}
                    className={cn(isSelected && "bg-muted/40")}
                  >
                    <TableCell className="px-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(row.id)}
                        aria-label={`Seleccionar cotización ${row.code}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {row.code}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {TYPE_LABELS[row.type]}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium leading-tight">
                        {counterpart ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="leading-tight">{vehicleLabel}</p>
                      {vehicleMeta && (
                        <p className="text-xs text-muted-foreground">
                          {vehicleMeta}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {amount ? formatCurrency(amount, row.currency) : "—"}
                    </TableCell>
                    <TableCell>
                      <QuotationStatusBadge status={row.effectiveStatus} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(row.validUntil).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </TableCell>
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
                              <Link
                                href={`/dashboard/cotizaciones/${row.id}`}
                              />
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            render={
                              <a
                                href={`/api/cotizaciones/${row.id}/pdf`}
                                target="_blank"
                                rel="noreferrer"
                              />
                            }
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Ver PDF
                          </DropdownMenuItem>
                          {isDeletable && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDelete(row.id)}
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
        title="Eliminar cotización"
        description="Se va a eliminar la cotización de forma permanente. Solo se pueden eliminar las pendientes o rechazadas — las aceptadas son histórico."
        confirmLabel="Eliminar"
        destructive
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        title={
          selectedCount === 1
            ? "Eliminar cotización"
            : `Eliminar ${selectedCount} cotizaciones`
        }
        description="Las pendientes y rechazadas se eliminarán de forma permanente. Las aceptadas se ignoran (son histórico de operaciones cerradas)."
        confirmLabel="Eliminar"
        destructive
        onConfirm={bulkDelete}
      />

      <ConfirmDialog
        open={confirmBulkReject}
        onOpenChange={setConfirmBulkReject}
        title={
          selectedCount === 1
            ? "Rechazar cotización"
            : `Rechazar ${selectedCount} cotizaciones`
        }
        description="Las cotizaciones pendientes vigentes se marcarán como rechazadas. Las que ya tengan otro estado se ignoran."
        confirmLabel={
          selectedCount === 1 ? "Rechazar cotización" : "Rechazar cotizaciones"
        }
        cancelLabel="Volver"
        onConfirm={bulkReject}
      />
    </div>
  );
}
