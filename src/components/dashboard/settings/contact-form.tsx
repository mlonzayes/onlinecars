"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Dealership } from "@prisma/client";
import { PROVINCIAS_ARGENTINA } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ContactFormProps {
  dealership: Dealership;
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  city: string;
  province: string;
  description: string;
}

function buildInitialState(dealership: Dealership): FormState {
  return {
    name: dealership.name ?? "",
    phone: dealership.phone ?? "",
    email: dealership.email ?? "",
    whatsapp: dealership.whatsapp ?? "",
    address: dealership.address ?? "",
    city: dealership.city ?? "",
    province: dealership.province ?? "",
    description: dealership.description ?? "",
  };
}

export function ContactForm({ dealership }: ContactFormProps) {
  const [form, setForm] = useState<FormState>(buildInitialState(dealership));
  const [loading, setLoading] = useState(false);

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/concesionario", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Error al guardar");
      }

      toast.success("Información actualizada correctamente");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al guardar los datos";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de contacto</CardTitle>
        <CardDescription>Estos datos aparecen en tu sitio público.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Nombre del concesionario <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              placeholder="Ej: AutoCenter San Martín"
            />
          </div>

          {/* Teléfono y WhatsApp */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+54 11 1234-5678"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={form.whatsapp}
                onChange={(e) => handleChange("whatsapp", e.target.value)}
                placeholder="+54 9 11 1234-5678"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="contacto@tuconcesionario.com"
            />
          </div>

          {/* Dirección */}
          <div className="space-y-1.5">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Av. Corrientes 1234"
            />
          </div>

          {/* Ciudad y Provincia */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Buenos Aires"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="province">Provincia</Label>
              <Select
                value={form.province}
                onValueChange={(value) => value !== null && handleChange("province", value)}
              >
                <SelectTrigger id="province">
                  <SelectValue placeholder="Seleccioná una provincia" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCIAS_ARGENTINA.map((prov) => (
                    <SelectItem key={prov} value={prov}>
                      {prov}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Contá de qué se trata tu concesionario..."
              rows={3}
              className="resize-none"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
