"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  CUSTOMER_TYPES,
  CUSTOMER_DOCUMENT_TYPES,
  PROVINCIAS_ARGENTINA,
} from "@/lib/constants";
import type { Customer } from "@prisma/client";

interface CustomerFormProps {
  customer?: Customer;
}

interface FormState {
  type: string;
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  notes: string;
}

function buildInitialState(customer?: Customer): FormState {
  return {
    type: customer?.type ?? "individual",
    documentType: customer?.documentType ?? "DNI",
    documentNumber: customer?.documentNumber ?? "",
    firstName: customer?.firstName ?? "",
    lastName: customer?.lastName ?? "",
    businessName: customer?.businessName ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    address: customer?.address ?? "",
    city: customer?.city ?? "",
    province: customer?.province ?? "",
    notes: customer?.notes ?? "",
  };
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => buildInitialState(customer));
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(customer);
  const isCompany = form.type === "company";

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Si pasa a empresa, forzamos CUIT
      if (field === "type" && value === "company") {
        next.documentType = "CUIT";
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      type: form.type,
      documentType: form.documentType,
      documentNumber: form.documentNumber,
      firstName: form.firstName,
      lastName: form.lastName || undefined,
      businessName: form.businessName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      province: form.province || undefined,
      notes: form.notes || undefined,
    };

    try {
      const url = isEditing ? `/api/clientes/${customer!.id}` : "/api/clientes";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Ocurrió un error. Intentá de nuevo.");
        setLoading(false);
        return;
      }

      toast.success(isEditing ? "Cliente actualizado." : "Cliente creado.");
      // No reseteamos loading en éxito — el router.push es asíncrono y bajarlo
      // antes reactiva el botón mientras la página todavía está visible (riesgo
      // de doble-click → doble creación).
      router.push("/dashboard/clientes");
      router.refresh();
    } catch {
      toast.error("Error de conexión. Intentá de nuevo.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v) => v !== null && handleChange("type", v)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOMER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t === "individual" ? "Particular" : "Empresa"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="documentType">Tipo de documento</Label>
              <Select
                value={form.documentType}
                onValueChange={(v) => v !== null && handleChange("documentType", v)}
                disabled={isCompany}
              >
                <SelectTrigger id="documentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOMER_DOCUMENT_TYPES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="documentNumber">Número de documento *</Label>
              <Input
                id="documentNumber"
                value={form.documentNumber}
                onChange={(e) => handleChange("documentNumber", e.target.value)}
                placeholder={isCompany ? "30-12345678-9" : "12345678"}
                required
              />
            </div>

            {isCompany && (
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="businessName">Razón social *</Label>
                <Input
                  id="businessName"
                  value={form.businessName}
                  onChange={(e) => handleChange("businessName", e.target.value)}
                  placeholder="Auto Norte SA"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="firstName">
                {isCompany ? "Nombre del contacto *" : "Nombre *"}
              </Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="Juan"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lastName">{isCompany ? "Apellido del contacto" : "Apellido"}</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Pérez"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="cliente@email.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="11 1234-5678"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Av. Siempre Viva 742"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="city">Localidad</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="CABA"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="province">Provincia</Label>
              <Select
                value={form.province}
                onValueChange={(v) => v !== null && handleChange("province", v)}
              >
                <SelectTrigger id="province">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCIAS_ARGENTINA.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Notas internas sobre el cliente..."
                rows={4}
                maxLength={2000}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar"}
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/dashboard/clientes" />}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
