"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export interface WaitlistAdminEntry {
  id: string;
  email: string;
  name: string | null;
  dealership: string | null;
  phone: string | null;
  status: string;
  inviteToken: string | null;
  invitedAt: string | null;
  inviteExpiresAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
}

interface Props {
  entries: WaitlistAdminEntry[];
}

const STATUS_COPY: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "bg-gray-100 text-gray-700" },
  invited: { label: "Invitado", className: "bg-blue-100 text-blue-700" },
  accepted: { label: "Activado", className: "bg-green-100 text-green-700" },
  rejected: { label: "Rechazado", className: "bg-red-100 text-red-700" },
};

export function WaitlistAdminClient({ entries: initial }: Props) {
  const [entries, setEntries] = useState<WaitlistAdminEntry[]>(initial);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<{
    url: string;
    email: string;
    expiresAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleApprove(entry: WaitlistAdminEntry) {
    setApprovingId(entry.id);
    try {
      const res = await fetch(`/api/admin/waitlist/${entry.id}/invite`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al aprobar");
        return;
      }
      setGeneratedLink({ url: data.url, email: entry.email, expiresAt: data.expiresAt });
      // Marcar localmente como "invited" sin re-fetch del server.
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entry.id
            ? { ...e, status: "invited", inviteToken: data.token, inviteExpiresAt: data.expiresAt }
            : e
        )
      );
    } catch {
      toast.error("Error de conexión");
    } finally {
      setApprovingId(null);
    }
  }

  async function copyToClipboard(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar — copialo manual");
    }
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-white py-16 text-center">
        <p className="text-muted-foreground">No hay leads en el waitlist todavía.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Contacto</th>
              <th className="px-4 py-3 font-medium">Concesionario</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Cargado</th>
              <th className="px-4 py-3 font-medium text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.map((entry) => {
              const statusCfg = STATUS_COPY[entry.status] ?? STATUS_COPY.pending;
              return (
                <tr key={entry.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{entry.name ?? "—"}</div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {entry.email}
                      </span>
                      {entry.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {entry.phone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.dealership ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge className={`${statusCfg.className} text-xs`}>{statusCfg.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {entry.status === "pending" && (
                      <Button
                        size="sm"
                        disabled={approvingId === entry.id}
                        onClick={() => handleApprove(entry)}
                      >
                        {approvingId === entry.id ? (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        Aprobar
                      </Button>
                    )}
                    {entry.status === "invited" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={approvingId === entry.id}
                        onClick={() => handleApprove(entry)}
                      >
                        {approvingId === entry.id ? (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        Ver / regenerar link
                      </Button>
                    )}
                    {entry.status === "accepted" && (
                      <span className="text-xs text-muted-foreground">Registrado</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog
        open={generatedLink !== null}
        onOpenChange={(open) => {
          if (!open) {
            setGeneratedLink(null);
            setCopied(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Link de invitación generado</DialogTitle>
            <DialogDescription>
              Copiá el link y mándaselo a <strong>{generatedLink?.email}</strong> por WhatsApp o email.
              El link vence el{" "}
              {generatedLink &&
                new Date(generatedLink.expiresAt).toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              .
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/30 p-3 font-mono text-xs break-all">
            {generatedLink?.url}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setGeneratedLink(null);
                setCopied(false);
              }}
            >
              Cerrar
            </Button>
            <Button onClick={() => generatedLink && copyToClipboard(generatedLink.url)}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar link
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
