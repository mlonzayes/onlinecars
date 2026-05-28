"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Link as LinkIcon, Trash2, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface UsersTabProps {
  users: Array<{ id: string; email: string; role: string }>;
  invites: Array<{ id: string; role: string; token: string; createdAt: Date }>;
  limits: { maxUsers: number };
  // Estado actual del toggle de visibilidad de costos.
  showCostsToNonAdmins: boolean;
  // Si el user logueado es admin (solo admin puede editar el toggle).
  isAdmin: boolean;
}

export function UsersTab({
  users,
  invites,
  limits,
  showCostsToNonAdmins,
  isAdmin,
}: UsersTabProps) {
  const [costsToggle, setCostsToggle] = useState(showCostsToNonAdmins);
  const [costsLoading, setCostsLoading] = useState(false);
  const [confirmInviteId, setConfirmInviteId] = useState<string | null>(null);

  async function handleToggleCosts(next: boolean) {
    if (!isAdmin) return;
    const previous = costsToggle;
    setCostsToggle(next);
    setCostsLoading(true);
    try {
      const res = await fetch("/api/concesionario", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showCostsToNonAdmins: next }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      toast.success(
        next
          ? "Vendedores y editores ahora pueden ver el precio de costo"
          : "Solo admins ven el precio de costo"
      );
    } catch {
      setCostsToggle(previous);
      toast.error("No se pudo guardar el cambio");
    } finally {
      setCostsLoading(false);
    }
  }

  const [loading, setLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const totalAccounts = users.length + invites.length;
  const canInvite = totalAccounts < limits.maxUsers;

  async function handleCreateInvite() {
    if (!canInvite) return;
    setLoading(true);
    try {
      const res = await fetch("/api/concesionario/usuarios/invitar", {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Error al generar el link");
      }
      toast.success("Link mágico generado. Copialo y envialo al vendedor.");
      // Forzar recarga de la página para ver la nueva invitación
      window.location.reload();
    } catch (_error) {
      toast.error("Ocurrió un error al crear la invitación.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteInviteConfirmed() {
    if (!confirmInviteId) return;
    const id = confirmInviteId;
    try {
      await fetch(`/api/concesionario/usuarios/invitar/${id}`, { method: "DELETE" });
      toast.success("Invitación cancelada");
      window.location.reload();
    } catch {
      toast.error("Error al cancelar la invitación");
    } finally {
      setConfirmInviteId(null);
    }
  }

  function handleCopyLink(token: string) {
    const url = `${window.location.origin}/invite?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast.success("Link copiado al portapapeles");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Cuentas y Accesos</h2>
          <p className="text-sm text-muted-foreground">
            Gestioná quién tiene acceso a la concesionaria. Límite: {limits.maxUsers === Infinity ? "Ilimitado" : limits.maxUsers} usuarios.
          </p>
        </div>
        <Button onClick={handleCreateInvite} disabled={!canInvite || loading}>
          <Users className="mr-2 h-4 w-4" />
          Invitar Vendedor
        </Button>
      </div>

      {!canInvite && (
        <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
          <p className="text-sm text-yellow-800">
            Alcanzaste el límite de usuarios de tu plan ({limits.maxUsers}). Mejorá tu plan para agregar más vendedores.
          </p>
        </div>
      )}

      {/* Invitaciones Pendientes */}
      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enlaces Mágicos Activos</CardTitle>
            <CardDescription>
              Compartí estos enlaces con tus vendedores para que creen su cuenta. Son de un solo uso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-md">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Link para nuevo {invite.role}</p>
                    <p className="text-xs text-muted-foreground">Creado el {new Date(invite.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleCopyLink(invite.token)}>
                    {copiedToken === invite.token ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setConfirmInviteId(invite.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Usuarios Activos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usuarios Activos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium">{user.email || "Usuario sin email público"}</p>
                  <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                </div>
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                  {user.role}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Visibilidad de costos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Visibilidad del precio de costo</CardTitle>
          <CardDescription>
            Los admins siempre ven el precio de costo de los vehículos.
            Podés habilitar que vendedores y editores también lo vean.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Mostrar a vendedores y editores</p>
              <p className="text-xs text-muted-foreground">
                Si está desactivado, solo los admins pueden ver el costo de compra.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {costsLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
              <input
                type="checkbox"
                checked={costsToggle}
                disabled={!isAdmin || costsLoading}
                onChange={(e) => handleToggleCosts(e.target.checked)}
                className="h-5 w-9 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </label>
          {!isAdmin && (
            <p className="text-xs text-muted-foreground mt-2">
              Solo un admin puede modificar este permiso.
            </p>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmInviteId !== null}
        onOpenChange={(open) => !open && setConfirmInviteId(null)}
        title="Cancelar invitación"
        description="El link mágico va a quedar inválido. La persona ya no podrá usarlo para crear su cuenta."
        confirmLabel="Cancelar invitación"
        destructive
        onConfirm={handleDeleteInviteConfirmed}
      />
    </div>
  );
}
