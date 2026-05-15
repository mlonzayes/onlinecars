"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Link as LinkIcon, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface UsersTabProps {
  users: Array<{ id: string; email: string; role: string }>;
  invites: Array<{ id: string; role: string; token: string; createdAt: Date }>;
  limits: { maxUsers: number };
}

export function UsersTab({ users, invites, limits }: UsersTabProps) {
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
    } catch (error) {
      toast.error("Ocurrió un error al crear la invitación.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteInvite(id: string) {
    if (!confirm("¿Seguro que querés cancelar esta invitación?")) return;
    try {
      await fetch(`/api/concesionario/usuarios/invitar/${id}`, { method: "DELETE" });
      toast.success("Invitación cancelada");
      window.location.reload();
    } catch {
      toast.error("Error al cancelar la invitación");
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
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteInvite(invite.id)}>
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
    </div>
  );
}
