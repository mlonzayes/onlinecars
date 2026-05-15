"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, MessageCircle, ShoppingCart, Trash2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LeadDetailSheet } from "./lead-detail-sheet";

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
}

const SOURCE_LABELS: Record<string, string> = {
  web: "Web",
  whatsapp: "WhatsApp",
  mercadolibre: "MercadoLibre",
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
  onSelect: (lead: SerializedLead) => void;
  onDelete: (id: string) => Promise<void>;
  onToggleRead: (lead: SerializedLead) => Promise<void>;
}

function LeadsList({ leads, onSelect, onDelete, onToggleRead }: LeadsListProps) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="font-medium text-muted-foreground">No hay leads en esta categoría</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
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

            return (
              <TableRow
                key={lead.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSelect(lead)}
              >
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

export function LeadsTable({ leads: initialLeads }: LeadsTableProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<SerializedLead[]>(initialLeads);
  const [selectedLead, setSelectedLead] = useState<SerializedLead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("all");

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

  async function handleDelete(id: string) {
    if (!confirm("¿Seguro que querés eliminar este lead?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    setLeads((prev) => prev.filter((l) => l.id !== id));
    if (selectedLead?.id === id) setSheetOpen(false);
    router.refresh();
  }

  return (
    <>
      <Tabs defaultValue="all">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="all">Todos ({filteredLeads.length})</TabsTrigger>
            <TabsTrigger value="unread">
              No leídos
              {unreadLeads.length > 0 && (
                <Badge variant="destructive" className="ml-1.5 h-4 px-1 text-[10px]">
                  {unreadLeads.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="contacted">Contactados ({contactedLeads.length})</TabsTrigger>
          </TabsList>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Todas las fuentes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las fuentes</SelectItem>
              <SelectItem value="web">Sitio Web</SelectItem>
              <SelectItem value="mercadolibre">Mercado Libre</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="all">
          <LeadsList
            leads={filteredLeads}
            onSelect={handleSelect}
            onDelete={handleDelete}
            onToggleRead={handleToggleRead}
          />
        </TabsContent>

        <TabsContent value="unread">
          <LeadsList
            leads={unreadLeads}
            onSelect={handleSelect}
            onDelete={handleDelete}
            onToggleRead={handleToggleRead}
          />
        </TabsContent>

        <TabsContent value="contacted">
          <LeadsList
            leads={contactedLeads}
            onSelect={handleSelect}
            onDelete={handleDelete}
            onToggleRead={handleToggleRead}
          />
        </TabsContent>
      </Tabs>

      <LeadDetailSheet
        lead={selectedLead}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}
