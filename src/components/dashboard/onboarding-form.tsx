"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dealershipCreateSchema, type DealershipCreateInput } from "@/lib/validators/dealership";
import { slugify } from "@/lib/utils";
import { PROVINCIAS_ARGENTINA } from "@/lib/constants";

type FormFields = Omit<DealershipCreateInput, "description" | "whatsapp" | "website">;
type FieldErrors = Partial<Record<keyof FormFields, string>>;

export function OnboardingForm() {
  // country arranca en "AR" como default. TODO (próximo paso): selector de país
  // en el onboarding + aplicar COUNTRY_DEFAULTS (moneda/locale/timezone) en el handler.
  const [fields, setFields] = useState<FormFields>({ name: "", slug: "", phone: "", email: "", address: "", city: "", province: "", country: "AR" });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    setFields((prev) => ({ ...prev, name, slug: slugManuallyEdited ? prev.slug : slugify(name) }));
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlugManuallyEdited(true);
    setFields((prev) => ({ ...prev, slug: slugify(e.target.value) }));
  }

  function handleField(key: keyof FormFields) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setFields((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});
    setTermsError(false);

    const parsed = dealershipCreateSchema.safeParse(fields);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        name: flat.name?.[0],
        slug: flat.slug?.[0],
        email: flat.email?.[0],
        address: flat.address?.[0],
        city: flat.city?.[0],
        province: flat.province?.[0],
      });
      return;
    }

    if (!acceptedTerms) {
      setTermsError(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, acceptTerms: true }),
      });

      if (res.ok) {
        // Navegación DURA (no router.push) a propósito. El layout de /dashboard
        // gatea por dealership: con router.refresh()+push() hay un race —el push
        // navega contra el cache del router antes de que el refresh termine, y el
        // layout todavía ve "sin dealership → redirect /onboarding".
        // window.location fuerza un render fresco del server: getCurrentDealership
        // (React cache, per-request) ya encuentra el dealership recién creado.
        // Dejamos isSubmitting en true: la página se va a recargar entera.
        window.location.href = "/dashboard";
        return;
      }

      const json = (await res.json()) as { error: string; details?: { fieldErrors?: Record<string, string[]> } };

      if (res.status === 409 && json.details?.fieldErrors?.slug) {
        setFieldErrors({ slug: "El nombre de sitio ya está en uso. Elegí otro." });
        setIsSubmitting(false);
        return;
      }
      setServerError(json.error ?? "Ocurrió un error inesperado.");
      setIsSubmitting(false);
    } catch {
      setServerError("No se pudo conectar con el servidor. Intentá de nuevo.");
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Datos del concesionario</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre del concesionario *</Label>
            <Input id="name" placeholder="Ej: Automotores García" value={fields.name} onChange={handleNameChange} />
            {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Nombre de tu sitio *</Label>
            <Input id="slug" placeholder="automotores-garcia" value={fields.slug} onChange={handleSlugChange} />
            {fields.slug && (
              <p className="text-xs text-muted-foreground">
                Tu sitio quedará en:{" "}
                <span className="font-medium text-foreground">{fields.slug}.motorflowapp.com</span>
              </p>
            )}
            {fieldErrors.slug && <p className="text-sm text-destructive">{fieldErrors.slug}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" placeholder="011 1234-5678" value={fields.phone ?? ""} onChange={handleField("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="info@garcia.com" value={fields.email ?? ""} onChange={handleField("email")} />
              {fieldErrors.email && <p className="text-sm text-destructive">{fieldErrors.email}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Dirección *</Label>
            <Input
              id="address"
              placeholder="Ej: Av. Perón 1234"
              value={fields.address ?? ""}
              onChange={handleField("address")}
            />
            {fieldErrors.address && <p className="text-sm text-destructive">{fieldErrors.address}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city">Ciudad *</Label>
              <Input id="city" placeholder="Ej: Rosario" value={fields.city ?? ""} onChange={handleField("city")} />
              {fieldErrors.city && <p className="text-sm text-destructive">{fieldErrors.city}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="province">Provincia *</Label>
              <Select
                value={fields.province ?? ""}
                onValueChange={(val) => {
                  if (typeof val === "string") {
                    setFields((prev) => ({ ...prev, province: val }));
                  }
                }}
              >
                <SelectTrigger id="province" className="w-full">
                  <SelectValue placeholder="Seleccioná" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCIAS_ARGENTINA.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.province && <p className="text-sm text-destructive">{fieldErrors.province}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  if (e.target.checked) setTermsError(false);
                }}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer"
              />
              <span>
                Acepto los{" "}
                <a href="/terminos" target="_blank" className="text-blue-600 underline underline-offset-2">
                  Términos y Condiciones
                </a>{" "}
                y la{" "}
                <a href="/privacidad" target="_blank" className="text-blue-600 underline underline-offset-2">
                  Política de Privacidad
                </a>.
              </span>
            </label>
            {termsError && (
              <p className="text-sm text-destructive">
                Tenés que aceptar los Términos y Condiciones para continuar.
              </p>
            )}
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Crear mi concesionario"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
