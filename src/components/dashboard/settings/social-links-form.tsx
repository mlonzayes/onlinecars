"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SOCIAL_NETWORKS, SOCIAL_NETWORK_META, type SocialNetwork } from "@/lib/constants";
import { SOCIAL_ICON_BY_NETWORK } from "@/components/tenant/social-icons";
import type { SocialLinks } from "@/types";

interface SocialLinksFormProps {
  socialLinks: SocialLinks | null;
}

type FormState = Record<SocialNetwork, string>;

function buildInitialState(socialLinks: SocialLinks | null): FormState {
  return SOCIAL_NETWORKS.reduce((acc, network) => {
    acc[network] = socialLinks?.[network] ?? "";
    return acc;
  }, {} as FormState);
}

// Form de redes sociales del concesionario. El dealer puede pegar la URL completa
// o solo su usuario — el backend normaliza a URL (ver lib/social.ts). WhatsApp NO
// está acá: usa el número del form de contacto.
export function SocialLinksForm({ socialLinks }: SocialLinksFormProps) {
  const [form, setForm] = useState<FormState>(buildInitialState(socialLinks));
  const [saving, setSaving] = useState(false);

  function handleChange(network: SocialNetwork, value: string) {
    setForm((prev) => ({ ...prev, [network]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/concesionario", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialLinks: form }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al guardar");
        return;
      }
      toast.success("Redes sociales actualizadas");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-muted-foreground" />
          Redes sociales
        </CardTitle>
        <CardDescription>
          Pegá el link o tu usuario de cada red. Se muestran como íconos en tu sitio público.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {SOCIAL_NETWORKS.map((network) => {
            const Icon = SOCIAL_ICON_BY_NETWORK[network];
            const meta = SOCIAL_NETWORK_META[network];
            return (
              <div key={network} className="space-y-1.5">
                <Label htmlFor={`social-${network}`}>{meta.label}</Label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={`social-${network}`}
                    value={form[network]}
                    onChange={(e) => handleChange(network, e.target.value)}
                    placeholder={meta.placeholder}
                    className="pl-9"
                    autoComplete="off"
                  />
                </div>
              </div>
            );
          })}

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
