"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Globe, Image as ImageIcon, Palette, Link2, Power, ExternalLink, AppWindow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { DealershipTheme } from "@/types";

interface WebsiteSettingsProps {
  dealership: {
    slug: string;
    logo: string | null;
    favicon: string | null;
    website: string | null;
    siteEnabled: boolean;
  };
  theme: DealershipTheme | null;
}

const DEFAULT_COLOR = "#2563eb";

export function WebsiteSettings({ dealership, theme }: WebsiteSettingsProps) {
  const router = useRouter();
  const [colorPrimary, setColorPrimary] = useState(theme?.colorPrimary ?? DEFAULT_COLOR);
  const [logo, setLogo] = useState(dealership.logo ?? "");
  const [savingLogo, setSavingLogo] = useState(false);
  const [deletingLogo, setDeletingLogo] = useState(false);
  const [favicon, setFavicon] = useState(dealership.favicon ?? "");
  const [savingFavicon, setSavingFavicon] = useState(false);
  const [deletingFavicon, setDeletingFavicon] = useState(false);
  // Defensive ?? false: si el dealer fue cacheado en Redis ANTES de la
  // migration de siteEnabled, el campo viene undefined. useState lo trataría
  // como uncontrolled y Base UI tira warning al hacer el primer cambio.
  const [siteEnabled, setSiteEnabled] = useState(dealership.siteEnabled ?? false);
  const [togglingSite, setTogglingSite] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Dominio custom en standby (Fase 2) — read-only en la UI. Lo mostramos
  // como referencia pero no es editable. Ver el badge "Próximamente" abajo.
  const customDomain = dealership.website ?? "";

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

  async function handleUploadFavicon(file: File) {
    if (file.size > 1 * 1024 * 1024) {
      toast.error("El ícono no puede superar 1MB");
      return;
    }

    setSavingFavicon(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/concesionario/favicon", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al subir");

      setFavicon(json.data.url);
      toast.success("Ícono actualizado", { duration: 2000 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el ícono");
    } finally {
      setSavingFavicon(false);
    }
  }

  async function handleDeleteFavicon() {
    setDeletingFavicon(true);
    try {
      const res = await fetch("/api/concesionario/favicon", {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      setFavicon("");
      toast.success("Ícono eliminado", { duration: 2000 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el ícono");
    } finally {
      setDeletingFavicon(false);
    }
  }

  async function handleToggleSite(next: boolean) {
    // Optimistic UI: aplicamos el cambio antes de la respuesta. Si falla,
    // revertimos. El cache del bundle del tenant lo invalida el handler PUT.
    const previous = siteEnabled;
    setSiteEnabled(next);
    setTogglingSite(true);
    try {
      const res = await fetch("/api/concesionario", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteEnabled: next }),
      });
      if (!res.ok) throw new Error();
      // Forzamos refresh de RSC para que el server component vuelva a leer el
      // dealer (y los chequeos derivados — ej. que el link del sitio quede
      // activable sin recargar la pestaña).
      router.refresh();
      toast.success(next ? "Sitio activado" : "Sitio pausado", { duration: 2000 });
    } catch {
      setSiteEnabled(previous);
      toast.error("No se pudo cambiar el estado");
    } finally {
      setTogglingSite(false);
    }
  }

  const publicUrl = `https://${dealership.slug}.${appDomain}`;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Toggle ON/OFF — PRIMERA card, aparte. Es el control principal de la sección. */}
      <Card
        className={`lg:col-span-2 transition-colors ${
          siteEnabled ? "border-green-200" : "border-amber-200"
        }`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power
              className={`h-5 w-5 ${
                siteEnabled ? "text-green-600" : "text-amber-600"
              }`}
            />
            {siteEnabled ? "Sitio público activo" : "Sitio público pausado"}
          </CardTitle>
          <CardDescription>
            {siteEnabled
              ? "Cualquiera puede ver tu catálogo en el subdominio. Tu panel funciona como siempre."
              : "Los visitantes ven 404. Activá el sitio cuando esté listo para mostrar."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-foreground">
              {siteEnabled ? "Pausar sitio" : "Activar sitio"}
            </p>
            <Switch
              checked={siteEnabled}
              onCheckedChange={handleToggleSite}
              disabled={togglingSite}
              aria-label={siteEnabled ? "Pausar sitio" : "Activar sitio"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dirección del sitio — segunda card, full width. El link es el bloque entero
          si el sitio está activo (no un botón aparte). Si está pausado, queda como
          texto plano para no incitar al click hacia un 404. */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Dirección de tu sitio
          </CardTitle>
        </CardHeader>
        <CardContent>
          {siteEnabled ? (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-2 rounded-lg border bg-muted/50 px-4 py-3 transition-colors hover:border-blue-300 hover:bg-blue-50/50"
            >
              <span className="text-lg font-bold text-foreground group-hover:text-blue-700">
                {dealership.slug}.{appDomain}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-blue-600">
                Abrir <ExternalLink className="h-3 w-3" />
              </span>
            </a>
          ) : (
            <div className="rounded-lg border bg-muted/50 px-4 py-3">
              <p className="text-lg font-bold text-foreground/60">
                {dealership.slug}.{appDomain}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Activá el sitio para que esta dirección responda.
              </p>
            </div>
          )}
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

      {/* Ícono del sitio (favicon) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AppWindow className="h-5 w-5 text-cyan-500" />
            Ícono del sitio
          </CardTitle>
          <CardDescription>
            El ícono que aparece en la pestaña del navegador (favicon). Si no subís uno, se usa tu logo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {favicon ? (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={favicon} alt="Ícono preview" className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed bg-muted">
                <AppWindow className="h-7 w-7 text-muted-foreground/50" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadFavicon(file);
                  }}
                  disabled={savingFavicon || deletingFavicon}
                  className="cursor-pointer"
                />
                {favicon && (
                  <Button
                    variant="destructive"
                    onClick={handleDeleteFavicon}
                    disabled={savingFavicon || deletingFavicon}
                  >
                    Eliminar
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Ideal: PNG cuadrado (512x512 px). Máximo 1MB.</p>
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

      {/* Dominio personalizado — EN STANDBY (Fase 2). Mostrado como "Próximamente".
          Para reactivar: poner CUSTOM_DOMAINS_ENABLED=true en el handler de
          /api/concesionario + terminar el routing del middleware, y volver a
          habilitar los controles de abajo (sacar disabled + el badge). */}
      <Card className="lg:col-span-2 relative overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-green-500" />
            Dominio personalizado
            <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              Próximamente
            </span>
          </CardTitle>
          <CardDescription>
            Vas a poder asociar tu propio dominio (ej: www.tuconcesionario.com.ar) a tu sitio.
            Esta función estará disponible próximamente en los planes Premium.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 opacity-50 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="custom-domain">Tu dominio</Label>
              <Input
                id="custom-domain"
                value={customDomain}
                disabled
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
          <Button disabled className="w-full sm:w-auto">
            Próximamente
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
