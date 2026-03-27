"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dealershipCreateSchema, type DealershipCreateInput } from "@/lib/validators/dealership";
import { slugify } from "@/lib/utils";
import { PROVINCIAS_ARGENTINA } from "@/lib/constants";

type FormFields = Omit<DealershipCreateInput, "description" | "whatsapp" | "address" | "website">;
type FieldErrors = Partial<Record<keyof FormFields, string>>;

export function OnboardingForm() {
  const router = useRouter();
  const [fields, setFields] = useState<FormFields>({ name: "", slug: "", phone: "", email: "", city: "", province: "" });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
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

    const parsed = dealershipCreateSchema.safeParse(fields);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({ name: flat.name?.[0], slug: flat.slug?.[0], email: flat.email?.[0] });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (res.ok) { router.push("/dashboard"); return; }

      const json = (await res.json()) as { error: string; details?: { fieldErrors?: Record<string, string[]> } };

      if (res.status === 409 && json.details?.fieldErrors?.slug) {
        setFieldErrors({ slug: "El nombre de sitio ya está en uso. Elegí otro." });
        return;
      }
      setServerError(json.error ?? "Ocurrió un error inesperado.");
    } catch {
      setServerError("No se pudo conectar con el servidor. Intentá de nuevo.");
    } finally {
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
                <span className="font-medium text-foreground">{fields.slug}.onlinecars.com.ar</span>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" placeholder="Ej: Rosario" value={fields.city ?? ""} onChange={handleField("city")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="province">Provincia</Label>
              <Select onValueChange={(val) => setFields((prev) => ({ ...prev, province: val }))}>
                <SelectTrigger id="province">
                  <SelectValue placeholder="Seleccioná" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCIAS_ARGENTINA.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
