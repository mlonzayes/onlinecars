"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  CUSTOMER_TYPE_LABELS,
  CUSTOMER_DOCUMENT_TYPES,
  PROVINCIAS_ARGENTINA,
} from "@/lib/constants";
import { customerCreateSchema, type CustomerCreateInput } from "@/lib/validators/customer";
import type { Customer } from "@prisma/client";

interface CustomerFormProps {
  customer?: Customer;
}

function buildDefaults(customer?: Customer): CustomerCreateInput {
  return {
    type: (customer?.type as CustomerCreateInput["type"]) ?? "individual",
    documentType:
      (customer?.documentType as CustomerCreateInput["documentType"]) ?? "DNI",
    documentNumber: customer?.documentNumber ?? "",
    firstName: customer?.firstName ?? "",
    lastName: customer?.lastName ?? "",
    businessName: customer?.businessName ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    address: customer?.address ?? "",
    city: customer?.city ?? "",
    province: customer?.province as CustomerCreateInput["province"],
    notes: customer?.notes ?? "",
  };
}

// Mensaje de error rojo debajo de un campo. Centralizado para mantener
// consistencia visual a lo largo del form.
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-600 mt-1">{message}</p>;
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const isEditing = Boolean(customer);

  // Manejamos el loading aparte del isSubmitting de RHF: en éxito no lo
  // bajamos para evitar el doble-click clásico (ver regla 14 del CLAUDE.md).
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerCreateInput>({
    resolver: zodResolver(customerCreateSchema),
    defaultValues: buildDefaults(customer),
    mode: "onBlur",
  });

  const type = watch("type");
  const documentType = watch("documentType");
  const isCompany = type === "company";

  // Si pasa a empresa, forzamos CUIT (lo que después valida el schema cross-field).
  useEffect(() => {
    if (isCompany && documentType !== "CUIT") {
      setValue("documentType", "CUIT", { shouldValidate: true });
    }
  }, [isCompany, documentType, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true);

    // Limpiamos strings vacíos a undefined antes de enviar — la API espera ese shape.
    const payload = {
      ...data,
      lastName: data.lastName || undefined,
      businessName: data.businessName || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      province: data.province || undefined,
      notes: data.notes || undefined,
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
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Ocurrió un error. Intentá de nuevo.");
        setSubmitting(false);
        return;
      }

      toast.success(isEditing ? "Cliente actualizado." : "Cliente creado.");
      router.push("/dashboard/clientes");
      router.refresh();
    } catch {
      toast.error("Error de conexión. Intentá de nuevo.");
      setSubmitting(false);
    }
  });

  const documentPlaceholder = (() => {
    switch (documentType) {
      case "DNI": return "12345678";
      case "CUIT":
      case "CUIL": return "30-12345678-9";
      case "PASAPORTE": return "AA123456";
      default: return "";
    }
  })();

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="type">Tipo</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => v !== null && field.onChange(v)}
                  >
                    <SelectTrigger id="type">
                      {/* SelectValue por default muestra el value crudo (ej: "individual").
                          Forzamos el label en español pasándolo como children. */}
                      <SelectValue>{CUSTOMER_TYPE_LABELS[field.value]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOMER_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {CUSTOMER_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.type?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="documentType">Tipo de documento</Label>
              <Controller
                control={control}
                name="documentType"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => v !== null && field.onChange(v)}
                    disabled={isCompany}
                  >
                    <SelectTrigger id="documentType">
                      <SelectValue>{field.value}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOMER_DOCUMENT_TYPES.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.documentType?.message} />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="documentNumber">Número de documento *</Label>
              <Input
                id="documentNumber"
                placeholder={documentPlaceholder}
                aria-invalid={!!errors.documentNumber}
                {...register("documentNumber")}
              />
              <FieldError message={errors.documentNumber?.message} />
            </div>

            {isCompany && (
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="businessName">Razón social *</Label>
                <Input
                  id="businessName"
                  placeholder="Auto Norte SA"
                  aria-invalid={!!errors.businessName}
                  {...register("businessName")}
                />
                <FieldError message={errors.businessName?.message} />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="firstName">
                {isCompany ? "Nombre del contacto *" : "Nombre *"}
              </Label>
              <Input
                id="firstName"
                placeholder="Juan"
                aria-invalid={!!errors.firstName}
                {...register("firstName")}
              />
              <FieldError message={errors.firstName?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lastName">
                {isCompany ? "Apellido del contacto" : "Apellido"}
              </Label>
              <Input
                id="lastName"
                placeholder="Pérez"
                aria-invalid={!!errors.lastName}
                {...register("lastName")}
              />
              <FieldError message={errors.lastName?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@email.com"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              <FieldError message={errors.email?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                placeholder="11 1234-5678"
                aria-invalid={!!errors.phone}
                {...register("phone")}
              />
              <FieldError message={errors.phone?.message} />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                placeholder="Av. Siempre Viva 742"
                aria-invalid={!!errors.address}
                {...register("address")}
              />
              <FieldError message={errors.address?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="city">Localidad</Label>
              <Input
                id="city"
                placeholder="CABA"
                aria-invalid={!!errors.city}
                {...register("city")}
              />
              <FieldError message={errors.city?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="province">Provincia</Label>
              <Controller
                control={control}
                name="province"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) => v !== null && field.onChange(v || undefined)}
                  >
                    <SelectTrigger id="province">
                      <SelectValue placeholder="Seleccionar">
                        {field.value || "Seleccionar"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCIAS_ARGENTINA.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.province?.message} />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Notas internas sobre el cliente..."
                rows={4}
                maxLength={2000}
                aria-invalid={!!errors.notes}
                {...register("notes")}
              />
              <FieldError message={errors.notes?.message} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando..." : "Guardar"}
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/dashboard/clientes" />}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
