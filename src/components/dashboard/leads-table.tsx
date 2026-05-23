"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Globe,
  Loader2,
  MessageCircle,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Lead } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import type { PlanLimits } from "@/lib/plans";
import { LeadDetailSheet } from "./lead-detail-sheet";

const UPGRADE_TOAST_TITLE = "Mejorá tu plan";
const UPGRADE_TOAST_DESC =
  "Las acciones masivas están disponibles a partir del plan Media.";

const BULK_STATUS_OPTIONS = [
  { value: "new", label: "Marcar como nuevo" },
  { value: "contacted", label: "Marcar como contactado" },
  { value: "qualified", label: "Marcar como calificado" },
  { value: "closed", label: "Marcar como cerrado" },
] as const;

const TOAST_DURATION = 2500;

// Lead serializado (fechas como string) con vehículo opcional
export type SerializedLead = Omit<Lead, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
  vehicle: {
    id: string;
    title: string;
    brand: string;
    model: string;
    year: number;
  } | null;
};

export interface LeadsTableProps {
  leads: SerializedLead[];
  limits: PlanLimits;
}

const SOURCE_LABELS: Record<string, string> = {
  web: "Web",
  whatsapp: "WhatsApp",
  mercadolibre: "MercadoLibre",
};

// Labels para el filtro de fuente — incluyen "all" para el caso "sin filtro".
// Base UI no replica el children del Item en el Value automáticamente como
// Radix, hay que pasarle el label vía render fn (ver SelectValue abajo).
const SOURCE_FILTER_LABELS: Record<string, string> = {
  all: "Todas las fuentes",
  web: "Sitio Web",
  whatsapp: "WhatsApp",
  mercadolibre: "Mercado Libre",
};

function SourceBadge({ source }: { source: string }) {
  const icons: Record<string, React.ReactNode> = {
    web: <Globe className="h-3 w-3" />,
    whatsapp: <MessageCircle className="h-3 w-3" />,
    mercadolibre: <ShoppingCart className="h-3 w-3" />,
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        "flex w-fit items-center gap-1 text-xs",
        source === "whatsapp" && "bg-green-100 text-green-800",
        source === "mercadolibre" && "bg-yellow-100 text-yellow-800",
      )}
    >
      {icons[source] ?? <Globe className="h-3 w-3" />}
      {SOURCE_LABELS[source] ?? source}
    </Badge>
  );
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

interface LeadsListProps {
  leads: SerializedLead[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (visibleIds: string[]) => void;
  onSelect: (lead: SerializedLead) => void;
  onDelete: (id: string) => void;
  onToggleRead: (lead: SerializedLead) => Promise<void>;
}

function LeadsList({
  leads,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onSelect,
  onDelete,
  onToggleRead,
}: LeadsListProps) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="font-medium text-muted-foreground">No hay leads en esta categoría</p>
      </div>
    );
  }

  const visibleIds = leads.map((l) => l.id);
  const visibleSelectedCount = visibleIds.filter((id) => selectedIds.has(id)).length;
  const allVisibleSelected = visibleSelectedCount === leads.length;
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected;

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px] px-4">
              <Checkbox
                checked={allVisibleSelected}
                indeterminate={someVisibleSelected}
                onCheckedChange={() => onToggleSelectAll(visibleIds)}
                aria-label="Seleccionar todos los visibles"
              />
            </TableHead>
            <TableHead className="w-[16px]" />
            <TableHead>Contacto</TableHead>
            <TableHead>Vehículo</TableHead>
            <TableHead>Fuente</TableHead>
            <TableHead>Teléfono / Email</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => {
            const isUnread = lead.status === "new";
            const isSelected = selectedIds.has(lead.id);

            return (
              <TableRow
                key={lead.id}
                className={cn(
                  "cursor-pointer hover:bg-muted/50",
                  isSelected && "bg-muted/40",
                )}
                onClick={() => onSelect(lead)}
              >
                {/* Checkbox de selección masiva */}
                <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect(lead.id)}
                    aria-label={`Seleccionar lead ${lead.name}`}
                  />
                </TableCell>

                {/* Indicador leído/no leído */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <span
                    className={cn(
                      "block h-2.5 w-2.5 rounded-full",
                      isUnread ? "bg-blue-500" : "bg-gray-300",
                    )}
                    title={isUnread ? "No leído" : "Leído"}
                  />
                </TableCell>

                {/* Nombre */}
                <TableCell>
                  <span className={cn("leading-tight", isUnread && "font-semibold")}>
                    {lead.name}
                  </span>
                </TableCell>

                {/* Vehículo */}
                <TableCell className="text-sm text-muted-foreground">
                  {lead.vehicle ? (
                    <span>
                      {lead.vehicle.brand} {lead.vehicle.model} {lead.vehicle.year}
                    </span>
                  ) : (
                    <span className="italic">General</span>
                  )}
                </TableCell>

                {/* Fuente */}
                <TableCell>
                  <SourceBadge source={lead.source} />
                </TableCell>

                {/* Teléfono / Email */}
                <TableCell className="text-sm text-muted-foreground">
                  {lead.phone ?? lead.email ?? "—"}
                </TableCell>

                {/* Fecha relativa */}
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {timeAgo(new Date(lead.createdAt))}
                </TableCell>

                {/* Acciones */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title={isUnread ? "Marcar como leído" : "Marcar como no leído"}
                      onClick={() => onToggleRead(lead)}
                    >
                      <span
                        className={cn(
                          "block h-2 w-2 rounded-full border",
                          isUnread
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-400 bg-transparent",
                        )}
                      />
                      <span className="sr-only">
                        {isUnread ? "Marcar leído" : "Marcar no leído"}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-600"
                      title="Eliminar"
                      onClick={() => onDelete(lead.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function LeadsTable({ leads: initialLeads, limits }: LeadsTableProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<SerializedLead[]>(initialLeads);
  const [selectedLead, setSelectedLead] = useState<SerializedLead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Selección masiva. Set por performance (lookups O(1)).
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const filteredLeads = leads.filter(
    (l) => sourceFilter === "all" || l.source === sourceFilter
  );

  const unreadLeads = filteredLeads.filter((l) => l.status === "new");
  const contactedLeads = filteredLeads.filter((l) => l.status !== "new");

  function handleSelect(lead: SerializedLead) {
    setSelectedLead(lead);
    setSheetOpen(true);
    // Si no estaba leído, marcarlo como leído en el estado local optimistamente
    if (lead.status === "new") {
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: "contacted" } : l))
      );
      setSelectedLead({ ...lead, status: "contacted" });
      // Sincronizar con el servidor en background
      fetch(`/api/leads/${lead.id}`, { method: "GET" }).then(() => router.refresh());
    }
  }

  async function handleStatusChange(leadId: string, status: string) {
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    // Actualizar estado local
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status } : l))
    );
    if (selectedLead?.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, status } : null));
    }
    router.refresh();
  }

  async function handleToggleRead(lead: SerializedLead) {
    const newStatus = lead.status === "new" ? "contacted" : "new";
    await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l))
    );
    router.refresh();
  }

  function handleDelete(id: string) {
    setConfirmDeleteId(id);
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (selectedLead?.id === id) setSheetOpen(false);
    router.refresh();
  }

  // ─── Selección masiva ─────────────────────────────────────────────────────

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

  /**
   * Si todos los visibles ya están seleccionados, los des-selecciona; si no,
   * suma los faltantes al set. Trabaja sobre `visibleIds` (la lista filtrada
   * por tab) para que el master checkbox refleje "todos los visibles".
   */
  function toggleSelectAll(visibleIds: string[]) {
    if (!limits.allowBulkActions) {
      toast(UPGRADE_TOAST_TITLE, { description: UPGRADE_TOAST_DESC });
      return;
    }
    setSelectedIds((prev) => {
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

  const selectedCount = selectedIds.size;

  async function bulkDelete() {
    if (selectedCount === 0) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.allSettled(
        ids.map((id) => fetch(`/api/leads/${id}`, { method: "DELETE" }))
      );
      const failed = results.filter(
        (r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok)
      ).length;
      const ok = ids.length - failed;

      if (ok > 0) {
        setLeads((prev) => prev.filter((l) => !selectedIds.has(l.id)));
        toast.success(
          ok === 1 ? "Lead eliminado" : `${ok} leads eliminados`,
          { duration: TOAST_DURATION }
        );
      }
      if (failed > 0) {
        toast.error(
          `${failed} ${failed === 1 ? "lead falló" : "leads fallaron"} al eliminar`,
          { duration: TOAST_DURATION }
        );
      }
      clearSelection();
      router.refresh();
    } finally {
      setBulkLoading(false);
    }
  }

  async function bulkSetStatus(status: string) {
    if (selectedCount === 0) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/leads/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          })
        )
      );
      const failed = results.filter(
        (r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok)
      ).length;
      const ok = ids.length - failed;

      if (ok > 0) {
        setLeads((prev) =>
          prev.map((l) => (selectedIds.has(l.id) ? { ...l, status } : l))
        );
        toast.success(
          ok === 1 ? "Lead actualizado" : `${ok} leads actualizados`,
          { duration: TOAST_DURATION }
        );
      }
      if (failed > 0) {
        toast.error(
          `${failed} ${failed === 1 ? "lead falló" : "leads fallaron"} al actualizar`,
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
    <>
      <Tabs defaultValue="all">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="all">
              Todos
              <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                {filteredLeads.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread">
              No leídos
              {unreadLeads.length > 0 && (
                <Badge variant="destructive" className="ml-1.5 h-4 px-1 text-[10px]">
                  {unreadLeads.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="contacted">
              Contactados
              <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                {contactedLeads.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value ?? "all")}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Todas las fuentes">
                {(value) =>
                  SOURCE_FILTER_LABELS[value as string] ?? "Todas las fuentes"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{SOURCE_FILTER_LABELS.all}</SelectItem>
              <SelectItem value="web">{SOURCE_FILTER_LABELS.web}</SelectItem>
              <SelectItem value="mercadolibre">{SOURCE_FILTER_LABELS.mercadolibre}</SelectItem>
              <SelectItem value="whatsapp">{SOURCE_FILTER_LABELS.whatsapp}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Toolbar de bulk actions — aparece solo cuando hay seleccionados */}
        {selectedCount > 0 && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-medium">
                {selectedCount} {selectedCount === 1 ? "seleccionado" : "seleccionados"}
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
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={bulkLoading}
                  className="inline-flex h-8 items-center gap-1 rounded-md border bg-background px-3 text-sm hover:bg-muted disabled:opacity-50"
                >
                  Cambiar estado
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {BULK_STATUS_OPTIONS.map((opt) => (
                    <DropdownMenuItem
                      key={opt.value}
                      onClick={() => bulkSetStatus(opt.value)}
                    >
                      {opt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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

        <TabsContent value="all">
          <LeadsList
            leads={filteredLeads}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onSelect={handleSelect}
            onDelete={handleDelete}
            onToggleRead={handleToggleRead}
          />
        </TabsContent>

        <TabsContent value="unread">
          <LeadsList
            leads={unreadLeads}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onSelect={handleSelect}
            onDelete={handleDelete}
            onToggleRead={handleToggleRead}
          />
        </TabsContent>

        <TabsContent value="contacted">
          <LeadsList
            leads={contactedLeads}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onSelect={handleSelect}
            onDelete={handleDelete}
            onToggleRead={handleToggleRead}
          />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Eliminar lead"
        description="Se va a eliminar la consulta de forma permanente. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        title={
          selectedCount === 1
            ? "Eliminar lead"
            : `Eliminar ${selectedCount} leads`
        }
        description="Se van a eliminar las consultas seleccionadas de forma permanente. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={bulkDelete}
      />

      <LeadDetailSheet
        lead={selectedLead}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}
