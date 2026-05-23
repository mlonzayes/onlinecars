"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, MessageCircle, ShoppingCart } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SerializedLead } from "./leads-table";

const STATUS_OPTIONS = [
  { value: "new", label: "Nuevo / No leído" },
  { value: "contacted", label: "Contactado" },
  { value: "qualified", label: "Calificado" },
  { value: "closed", label: "Cerrado" },
] as const;

const STATUS_LABEL_BY_VALUE: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label])
);

/**
 * Arma la URL de wa.me. Limpia caracteres no numéricos y, si el número no
 * tiene código país, asume Argentina (54). wa.me redirige a la app instalada
 * en mobile y abre WhatsApp Web en desktop.
 */
function buildWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("54") ? digits : `54${digits}`;
  return `https://wa.me/${intl}`;
}

const SOURCE_LABELS: Record<string, string> = {
  web: "Web",
  whatsapp: "WhatsApp",
  mercadolibre: "MercadoLibre",
};

function SourceIcon({ source }: { source: string }) {
  if (source === "whatsapp") return <MessageCircle className="h-3.5 w-3.5" />;
  if (source === "mercadolibre") return <ShoppingCart className="h-3.5 w-3.5" />;
  return <Globe className="h-3.5 w-3.5" />;
}

interface LeadDetailSheetProps {
  lead: SerializedLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (leadId: string, status: string) => Promise<void>;
}

export function LeadDetailSheet({
  lead,
  open,
  onOpenChange,
  onStatusChange,
}: LeadDetailSheetProps) {
  const [updating, setUpdating] = useState(false);

  if (!lead) return null;

  async function handleStatusChange(value: string) {
    if (!lead) return;
    setUpdating(true);
    try {
      await onStatusChange(lead.id, value);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto px-6 py-6">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-lg">{lead.name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* Datos de contacto */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Contacto
            </h3>
            <div className="rounded-md border divide-y text-sm">
              {lead.email && (
                <div className="flex justify-between px-3 py-2">
                  <span className="text-muted-foreground">Email</span>
                  <a
                    href={`mailto:${lead.email}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {lead.email}
                  </a>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-muted-foreground">Teléfono</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${lead.phone}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {lead.phone}
                    </a>
                    <a
                      href={buildWhatsAppUrl(lead.phone)}
                      target="_blank"
                      rel="noreferrer"
                      title="Abrir en WhatsApp"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-green-500 text-white transition-colors hover:bg-green-600"
                    >
                      <FaWhatsapp className="h-4 w-4" />
                      <span className="sr-only">Abrir en WhatsApp</span>
                    </a>
                  </div>
                </div>
              )}
              {!lead.email && !lead.phone && (
                <div className="px-3 py-2 text-muted-foreground">
                  Sin datos de contacto
                </div>
              )}
            </div>
          </section>

          {/* Vehículo de interés */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Vehículo de interés
            </h3>
            <div className="rounded-md border px-3 py-2 text-sm">
              {lead.vehicle ? (
                <Link
                  href={`/dashboard/vehiculos/${lead.vehicle.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {lead.vehicle.title} ({lead.vehicle.year})
                </Link>
              ) : (
                <span className="text-muted-foreground">Consulta general</span>
              )}
            </div>
          </section>

          {/* Mensaje */}
          {lead.message && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Mensaje
              </h3>
              <div className="rounded-md border px-3 py-2 text-sm whitespace-pre-wrap">
                {lead.message}
              </div>
            </section>
          )}

          {/* Fuente y fecha */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Detalles
            </h3>
            <div className="rounded-md border divide-y text-sm">
              <div className="flex justify-between items-center px-3 py-2">
                <span className="text-muted-foreground">Fuente</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    lead.source === "whatsapp" && "bg-green-100 text-green-800",
                    lead.source === "mercadolibre" && "bg-yellow-100 text-yellow-800",
                  )}
                >
                  <SourceIcon source={lead.source} />
                  {SOURCE_LABELS[lead.source] ?? lead.source}
                </Badge>
              </div>
              <div className="flex justify-between px-3 py-2">
                <span className="text-muted-foreground">Recibido</span>
                <span className="font-medium">
                  {new Date(lead.createdAt).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </section>

          {/* Estado */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Estado
            </h3>
            <Select
              value={lead.status}
              onValueChange={(value) => value !== null && handleStatusChange(value)}
              disabled={updating}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value) =>
                    STATUS_LABEL_BY_VALUE[value as string] ?? "Seleccionar estado"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
