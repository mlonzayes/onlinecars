"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Globe, Image as ImageIcon, Video, Palette, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DealershipTheme } from "@/types";
import type { Dealership } from "@prisma/client";

interface WebsiteSettingsProps {
  dealership: Dealership;
  theme: DealershipTheme | null;
}

const DEFAULT_COLOR = "#2563eb";

export function WebsiteSettings({ dealership, theme }: WebsiteSettingsProps) {
  const [colorPrimary, setColorPrimary] = useState(theme?.colorPrimary ?? DEFAULT_COLOR);
  const [heroType, setHeroType] = useState<"none" | "image" | "video">(theme?.heroType ?? "none");
  const [heroUrl, setHeroUrl] = useState(theme?.heroUrl ?? "");
  const [customDomain, setCustomDomain] = useState(theme?.customDomain ?? "");
  const [logo, setLogo] = useState(dealership.logo ?? "");
  const [savingLogo, setSavingLogo] = useState(false);
  const [savingDomain, setSavingDomain] = useState(false);
  const [savingHero, setSavingHero] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const appDomain = "onlinecars.com.ar";

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

  async function handleSaveLogo() {
    setSavingLogo(true);
    try {
      const res = await fetch("/api/concesionario", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo: logo || null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Logo actualizado", { duration: 2000 });
    } catch {
      toast.error("No se pudo guardar el logo");
    } finally {
      setSavingLogo(false);
    }
  }

  async function handleSaveHero() {
    setSavingHero(true);
    try {
      const res = await fetch("/api/concesionario/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroType,
          heroUrl: heroUrl || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Hero actualizado", { duration: 2000 });
    } catch {
      toast.error("No se pudo guardar el hero");
    } finally {
      setSavingHero(false);
    }
  }

  async function handleSaveDomain() {
    setSavingDomain(true);
    try {
      const res = await fetch("/api/concesionario/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customDomain: customDomain || null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Dominio guardado", { duration: 2000 });
    } catch {
      toast.error("No se pudo guardar el dominio");
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
          <CardDescription>Se mostrará en el header de tu sitio.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {logo && (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white">
                <img src={logo} alt="Logo preview" className="h-full w-full object-contain" />
              </div>
            )}
            <Input
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://ejemplo.com/logo.png"
            />
          </div>
          <Button onClick={handleSaveLogo} disabled={savingLogo} className="w-full">
            {savingLogo ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : "Guardar logo"}
          </Button>
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

      {/* Hero — full width */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-orange-500" />
            Sección Hero
          </CardTitle>
          <CardDescription>Imagen o video de fondo en la portada de tu sitio.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de fondo</Label>
            <div className="flex gap-2">
              {(["none", "image", "video"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setHeroType(type)}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all sm:flex-none ${
                    heroType === type
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  {type === "none" ? "Sin fondo" : type === "image" ? "Imagen" : "Video"}
                </button>
              ))}
            </div>
          </div>

          {heroType !== "none" && (
            <div className="space-y-2">
              <Label htmlFor="hero-url">
                URL de {heroType === "image" ? "la imagen" : "el video"}
              </Label>
              <Input
                id="hero-url"
                value={heroUrl}
                onChange={(e) => setHeroUrl(e.target.value)}
                placeholder={heroType === "image"
                  ? "https://ejemplo.com/hero.jpg"
                  : "https://ejemplo.com/hero.mp4"
                }
              />
            </div>
          )}

          <Button onClick={handleSaveHero} disabled={savingHero} className="w-full sm:w-auto">
            {savingHero ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : "Guardar hero"}
          </Button>
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
