"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Globe, Image as ImageIcon, Palette, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DealershipTheme } from "@/types";

interface WebsiteSettingsProps {
  dealership: {
    slug: string;
    logo: string | null;
    website: string | null;
  };
  theme: DealershipTheme | null;
}

const DEFAULT_COLOR = "#2563eb";

export function WebsiteSettings({ dealership, theme }: WebsiteSettingsProps) {
  const [colorPrimary, setColorPrimary] = useState(theme?.colorPrimary ?? DEFAULT_COLOR);
  const [customDomain, setCustomDomain] = useState(dealership.website ?? "");
  const [logo, setLogo] = useState(dealership.logo ?? "");
  const [savingLogo, setSavingLogo] = useState(false);
  const [deletingLogo, setDeletingLogo] = useState(false);
  const [savingDomain, setSavingDomain] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const appDomain = "motorflowapp.com";

  const handleColorChange = useCallback((value: string) => {
    setColorPrimary(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/concesionario/theme", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ colorPrimary: value }),
        });
        if (!res.ok) throw new Error();
        toast.success("Color actualizado", { duration: 2000 });
      } catch {
        toast.error("No se pudo guardar el color");
      }
    }, 500);
  }, []);

  async function handleUploadLogo(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo no puede superar los 5MB");
      return;
    }
    
    setSavingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/concesionario/logo", {
        method: "POST",
        body: formData,
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al subir");
      
      setLogo(json.data.url);
      toast.success("Logo actualizado", { duration: 2000 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el logo");
    } finally {
      setSavingLogo(false);
    }
  }

  async function handleDeleteLogo() {
    setDeletingLogo(true);
    try {
      const res = await fetch("/api/concesionario/logo", {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      setLogo("");
      toast.success("Logo eliminado", { duration: 2000 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el logo");
    } finally {
      setDeletingLogo(false);
    }
  }

  async function handleSaveDomain() {
    setSavingDomain(true);
    try {
      const res = await fetch("/api/concesionario", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website: customDomain.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          throw new Error("El dominio ya está registrado por otra concesionaria.");
        }
        if (res.status === 400 && data.details?.fieldErrors?.website) {
          throw new Error(data.details.fieldErrors.website[0]);
        }
        throw new Error(data.error || "No se pudo guardar el dominio");
      }
      toast.success("Dominio guardado", { duration: 2000 });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el dominio");
    } finally {
      setSavingDomain(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Subdominio (read-only) — full width */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Tu sitio web
          </CardTitle>
          <CardDescription>Tu concesionario está disponible en este subdominio.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/50 px-4 py-3">
            <p className="text-sm text-muted-foreground">Dirección de tu sitio</p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {dealership.slug}.{appDomain}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-purple-500" />
            Logo
          </CardTitle>
          <CardDescription>Subí el logo que se mostrará en el header de tu sitio (JPG, PNG, WebP, máx 5MB).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {logo ? (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt="Logo preview" className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed bg-muted">
                <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadLogo(file);
                  }}
                  disabled={savingLogo || deletingLogo}
                  className="cursor-pointer"
                />
                {logo && (
                  <Button
                    variant="destructive"
                    onClick={handleDeleteLogo}
                    disabled={savingLogo || deletingLogo}
                  >
                    Eliminar logo
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Medida ideal recomendada: 250x60 píxeles (formato horizontal). Máximo 5MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color de marca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-pink-500" />
            Color de marca
          </CardTitle>
          <CardDescription>Se usa en botones y acentos de tu sitio público.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input
              id="color-primary"
              type="color"
              value={colorPrimary}
              onChange={(e) => handleColorChange(e.target.value)}
              className="h-12 w-12 cursor-pointer rounded-lg border border-input bg-transparent p-1"
            />
            <div className="flex flex-1 items-center gap-3">
              <div
                className="h-10 w-full max-w-[120px] rounded-lg border border-border"
                style={{ backgroundColor: colorPrimary }}
              />
              <span className="font-mono text-sm text-muted-foreground">{colorPrimary}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dominio personalizado — full width */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-green-500" />
            Dominio personalizado
          </CardTitle>
          <CardDescription>
            Asociá tu propio dominio a tu sitio web.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="custom-domain">Tu dominio</Label>
              <Input
                id="custom-domain"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="www.miconcesionario.com.ar"
              />
            </div>
            <div className="space-y-2">
              <Label>Configuración DNS</Label>
              <div className="rounded-lg border bg-muted/50 px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">CNAME → </span>
                <span className="font-mono font-medium text-foreground">cname.{appDomain}</span>
              </div>
            </div>
          </div>
          <Button onClick={handleSaveDomain} disabled={savingDomain} className="w-full sm:w-auto">
            {savingDomain ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : "Guardar dominio"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
