"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CURRENCIES,
  DEFAULT_QUOTATION_VALIDITY_DAYS,
  FUEL_TYPES,
  FUEL_TYPE_LABELS,
  QUOTATION_PAYMENT_METHODS,
  TRANSMISSION_TYPES,
  TRANSMISSION_TYPE_LABELS,
  VEHICLE_CONDITIONS,
  VEHICLE_CONDITION_LABELS,
  type FuelType,
  type QuotationPaymentMethod,
  type TransmissionType,
  type VehicleCondition,
} from "@/lib/constants";

const PAYMENT_METHOD_LABELS: Record<QuotationPaymentMethod, string> = {
  cash: "Contado",
  financed: "Financiado",
  mixed: "Mixto",
};

interface FormState {
  leadId: string;
  sellerName: string;
  sellerDocument: string;
  sellerEmail: string;
  sellerPhone: string;
  brand: string;
  model: string;
  year: string;
  version: string;
  kilometers: string;
  color: string;
  transmission: TransmissionType | "";
  fuelType: FuelType | "";
  condition: VehicleCondition | "";
  offerAmount: string;
  paymentMethod: QuotationPaymentMethod;
  currency: string;
  validityDays: string;
  notes: string;
}

const INITIAL_STATE: FormState = {
  leadId: "",
  sellerName: "",
  sellerDocument: "",
  sellerEmail: "",
  sellerPhone: "",
  brand: "",
  model: "",
  year: "",
  version: "",
  kilometers: "",
  color: "",
  transmission: "",
  fuelType: "",
  condition: "",
  offerAmount: "",
  paymentMethod: "cash",
  currency: "ARS",
  validityDays: String(DEFAULT_QUOTATION_VALIDITY_DAYS),
  notes: "",
};

interface QuotationPurchaseFormProps {
  // Si viene, modo EDIT: PUT a /api/cotizaciones/{id} + redirect al detail.
  quotationId?: string;
  // Lead pre-asignado (uso típico: "Cotizar" desde un Lead). Ignorado si initialValues trae uno.
  leadId?: string;
  initialValues?: Partial<FormState>;
}

export function QuotationPurchaseForm({
  quotationId,
  leadId,
  initialValues,
}: QuotationPurchaseFormProps = {}) {
  const router = useRouter();
  const isEdit = !!quotationId;
  const [form, setForm] = useState<FormState>({
    ...INITIAL_STATE,
    leadId: leadId ?? "",
    ...(initialValues ?? {}),
  });
  const [submitting, setSubmitting] = useState(false);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !form.sellerName.trim() ||
      form.sellerName.trim().length < 2
    ) {
      toast.error("Ingresá el nombre del vendedor (mínimo 2 caracteres)");
      return;
    }
    if (!form.brand.trim() || !form.model.trim()) {
      toast.error("Ingresá marca y modelo del vehículo");
      return;
    }
    const year = parseInt(form.year, 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1900 || year > currentYear + 1) {
      toast.error(`Año inválido (1900 a ${currentYear + 1})`);
      return;
    }
    const offerAmount = parseFloat(form.offerAmount);
    if (!form.offerAmount || isNaN(offerAmount) || offerAmount <= 0) {
      toast.error("Ingresá una oferta válida");
      return;
    }
    const validityDays = parseInt(form.validityDays, 10);
    if (isNaN(validityDays) || validityDays < 1 || validityDays > 365) {
      toast.error("Validez inválida (1 a 365 días)");
      return;
    }

    setSubmitting(true);
    try {
      const vehicle: Record<string, unknown> = {
        brand: form.brand.trim(),
        model: form.model.trim(),
        year,
      };
      if (form.version.trim()) vehicle.version = form.version.trim();
      if (form.color.trim()) vehicle.color = form.color.trim();
      if (form.transmission) vehicle.transmission = form.transmission;
      if (form.fuelType) vehicle.fuelType = form.fuelType;
      if (form.condition) vehicle.condition = form.condition;
      if (form.kilometers) {
        const v = parseInt(form.kilometers, 10);
        if (!isNaN(v) && v >= 0) vehicle.kilometers = v;
      }

      const payload: Record<string, unknown> = {
        type: "purchase",
        seller: {
          name: form.sellerName.trim(),
          document: form.sellerDocument.trim() || undefined,
          email: form.sellerEmail.trim() || undefined,
          phone: form.sellerPhone.trim() || undefined,
        },
        vehicle,
        offerAmount,
        paymentMethod: form.paymentMethod,
        currency: form.currency,
        validityDays,
        notes: form.notes.trim() || undefined,
      };

      if (form.leadId.trim()) payload.leadId = form.leadId.trim();

      const url = isEdit
        ? `/api/cotizaciones/${quotationId}`
        : "/api/cotizaciones";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(
          data.error ??
            (isEdit ? "Error al actualizar la cotización" : "Error al crear la cotización")
        );
        setSubmitting(false);
        return;
      }

      const json = await res.json();
      toast.success(
        isEdit
          ? `Cotización ${json.data.code} actualizada`
          : `Cotización ${json.data.code} creada`
      );
      router.push(`/dashboard/cotizaciones/${json.data.id}`);
      router.refresh();
    } catch {
      toast.error("Error de conexión. Intentá de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Vendedor */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Datos del vendedor
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sellerName">Nombre *</Label>
                <Input
                  id="sellerName"
                  value={form.sellerName}
                  onChange={(e) => setField("sellerName", e.target.value)}
                  placeholder="Juan Pérez"
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sellerDocument">Documento</Label>
                <Input
                  id="sellerDocument"
                  value={form.sellerDocument}
                  onChange={(e) =>
                    setField("sellerDocument", e.target.value)
                  }
                  placeholder="DNI 30.123.456"
                  maxLength={50}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sellerEmail">Email</Label>
                <Input
                  id="sellerEmail"
                  type="email"
                  value={form.sellerEmail}
                  onChange={(e) => setField("sellerEmail", e.target.value)}
                  placeholder="vendedor@email.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sellerPhone">Teléfono</Label>
                <Input
                  id="sellerPhone"
                  value={form.sellerPhone}
                  onChange={(e) => setField("sellerPhone", e.target.value)}
                  placeholder="11-5555-5555"
                  maxLength={40}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehículo */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Datos del vehículo
            </h2>
            <div className="grid gap-4 sm:grid-cols-12">
              <div className="space-y-1.5 sm:col-span-4">
                <Label htmlFor="brand">Marca *</Label>
                <Input
                  id="brand"
                  value={form.brand}
                  onChange={(e) => setField("brand", e.target.value)}
                  placeholder="Toyota"
                  maxLength={60}
                  required
                />
              </div>
              <div className="space-y-1.5 sm:col-span-5">
                <Label htmlFor="model">Modelo *</Label>
                <Input
                  id="model"
                  value={form.model}
                  onChange={(e) => setField("model", e.target.value)}
                  placeholder="Corolla XEI"
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor="year">Año *</Label>
                <Input
                  id="year"
                  type="number"
                  min={1900}
                  max={new Date().getFullYear() + 1}
                  value={form.year}
                  onChange={(e) => setField("year", e.target.value)}
                  placeholder="2020"
                  required
                />
              </div>
              <div className="space-y-1.5 sm:col-span-6">
                <Label htmlFor="version">Versión</Label>
                <Input
                  id="version"
                  value={form.version}
                  onChange={(e) => setField("version", e.target.value)}
                  placeholder="2.0L CVT"
                  maxLength={120}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor="kilometers">Kilometraje</Label>
                <Input
                  id="kilometers"
                  type="number"
                  min={0}
                  step={1}
                  value={form.kilometers}
                  onChange={(e) => setField("kilometers", e.target.value)}
                  placeholder="80000"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={form.color}
                  onChange={(e) => setField("color", e.target.value)}
                  placeholder="Blanco perla"
                  maxLength={40}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-4">
                <Label htmlFor="transmission">Transmisión</Label>
                <Select
                  value={form.transmission}
                  onValueChange={(v) =>
                    setField(
                      "transmission",
                      (v as TransmissionType | "") ?? ""
                    )
                  }
                >
                  <SelectTrigger id="transmission" className="w-full">
                    <SelectValue placeholder="Seleccionar">
                      {(v) =>
                        v
                          ? TRANSMISSION_TYPE_LABELS[v as TransmissionType]
                          : "Seleccionar"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSMISSION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TRANSMISSION_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-4">
                <Label htmlFor="fuelType">Combustible</Label>
                <Select
                  value={form.fuelType}
                  onValueChange={(v) =>
                    setField("fuelType", (v as FuelType | "") ?? "")
                  }
                >
                  <SelectTrigger id="fuelType" className="w-full">
                    <SelectValue placeholder="Seleccionar">
                      {(v) =>
                        v ? FUEL_TYPE_LABELS[v as FuelType] : "Seleccionar"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {FUEL_TYPES.map((f) => (
                      <SelectItem key={f} value={f}>
                        {FUEL_TYPE_LABELS[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-4">
                <Label htmlFor="condition">Condición</Label>
                <Select
                  value={form.condition}
                  onValueChange={(v) =>
                    setField(
                      "condition",
                      (v as VehicleCondition | "") ?? ""
                    )
                  }
                >
                  <SelectTrigger id="condition" className="w-full">
                    <SelectValue placeholder="Seleccionar">
                      {(v) =>
                        v
                          ? VEHICLE_CONDITION_LABELS[v as VehicleCondition]
                          : "Seleccionar"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {VEHICLE_CONDITION_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Oferta */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Oferta de compra
            </h2>
            <div className="grid gap-4 sm:grid-cols-12">
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor="currency">Moneda</Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => v && setField("currency", v)}
                >
                  <SelectTrigger id="currency" className="w-full">
                    <SelectValue>{(v) => v as string}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-5">
                <Label htmlFor="offerAmount">Oferta *</Label>
                <Input
                  id="offerAmount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.offerAmount}
                  onChange={(e) => setField("offerAmount", e.target.value)}
                  placeholder="8000000"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-4">
                <Label htmlFor="paymentMethod">Forma de pago *</Label>
                <Select
                  value={form.paymentMethod}
                  onValueChange={(v) =>
                    v &&
                    setField("paymentMethod", v as QuotationPaymentMethod)
                  }
                >
                  <SelectTrigger id="paymentMethod" className="w-full">
                    <SelectValue>
                      {(v) =>
                        PAYMENT_METHOD_LABELS[v as QuotationPaymentMethod] ??
                        "Seleccionar"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {QUOTATION_PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {PAYMENT_METHOD_LABELS[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-4">
                <Label htmlFor="validityDays">Validez (días)</Label>
                <Input
                  id="validityDays"
                  type="number"
                  min={1}
                  max={365}
                  step={1}
                  value={form.validityDays}
                  onChange={(e) => setField("validityDays", e.target.value)}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-12">
                <Label htmlFor="notes">Observaciones</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  placeholder="Condiciones adicionales, requisitos, etc."
                  rows={3}
                  maxLength={2000}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEdit ? "Guardando..." : "Creando..."}
            </>
          ) : (
            isEdit ? "Guardar cambios" : "Crear cotización"
          )}
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={
            <Link
              href={
                isEdit
                  ? `/dashboard/cotizaciones/${quotationId}`
                  : "/dashboard/cotizaciones"
              }
            />
          }
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
