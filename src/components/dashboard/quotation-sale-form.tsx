"use client";

import { useEffect, useState } from "react";
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
import { Combobox } from "@/components/dashboard/combobox";
import {
  CURRENCIES,
  DEFAULT_QUOTATION_VALIDITY_DAYS,
  QUOTATION_PAYMENT_METHODS,
  type QuotationPaymentMethod,
} from "@/lib/constants";

interface VehicleOption {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: string;
  currency: string;
}

const PAYMENT_METHOD_LABELS: Record<QuotationPaymentMethod, string> = {
  cash: "Contado",
  financed: "Financiado",
  mixed: "Mixto",
};

interface FormState {
  vehicleId: string;
  clientName: string;
  clientDocument: string;
  clientEmail: string;
  clientPhone: string;
  totalPrice: string;
  downPayment: string;
  installments: string;
  installmentAmount: string;
  paymentMethod: QuotationPaymentMethod;
  sellerName: string;
  currency: string;
  validityDays: string;
  notes: string;
  // Permuta — opcional. Si `tradeInEnabled`, los campos son obligatorios en el
  // submit. La currency se guarda independiente del total porque el dealer
  // puede tasar el usado en otra moneda (típico: total ARS, usado USD).
  tradeInEnabled: boolean;
  tradeInBrand: string;
  tradeInModel: string;
  tradeInYear: string;
  tradeInValue: string;
  tradeInCurrency: string;
}

const INITIAL_STATE: FormState = {
  vehicleId: "",
  clientName: "",
  clientDocument: "",
  clientEmail: "",
  clientPhone: "",
  totalPrice: "",
  downPayment: "",
  installments: "",
  installmentAmount: "",
  paymentMethod: "cash",
  sellerName: "",
  currency: "ARS",
  validityDays: String(DEFAULT_QUOTATION_VALIDITY_DAYS),
  notes: "",
  tradeInEnabled: false,
  tradeInBrand: "",
  tradeInModel: "",
  tradeInYear: "",
  tradeInValue: "",
  tradeInCurrency: "ARS",
};

export function QuotationSaleForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function fetchVehicles(search: string) {
    setVehiclesLoading(true);
    try {
      // limit=5 — el dropdown del combobox prefiere pocos resultados al toque
      // por sobre traer todo el catálogo. El user filtra escribiendo.
      // El endpoint usa `?search=` (no `?q=`) — heredado de cuando se armó.
      const params = new URLSearchParams({ limit: "5", status: "available" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/vehiculos?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setVehicles(json.data ?? []);
      }
    } finally {
      setVehiclesLoading(false);
    }
  }

  useEffect(() => {
    void fetchVehicles("");
  }, []);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleVehicleChange(id: string) {
    setField("vehicleId", id);
    const v = vehicles.find((x) => x.id === id);
    if (v && !form.totalPrice) {
      setField("totalPrice", v.price);
      setField("currency", v.currency);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.vehicleId) {
      toast.error("Seleccioná un vehículo");
      return;
    }
    if (!form.clientName.trim() || form.clientName.trim().length < 2) {
      toast.error("Ingresá el nombre del cliente (mínimo 2 caracteres)");
      return;
    }
    const totalPrice = parseFloat(form.totalPrice);
    if (!form.totalPrice || isNaN(totalPrice) || totalPrice <= 0) {
      toast.error("Ingresá un precio válido");
      return;
    }
    const validityDays = parseInt(form.validityDays, 10);
    if (isNaN(validityDays) || validityDays < 1 || validityDays > 365) {
      toast.error("Validez inválida (1 a 365 días)");
      return;
    }

    // Validación de la permuta: si está activa, todos los campos son requeridos.
    let tradeInPayload:
      | {
          brand: string;
          model: string;
          year: number;
          value: number;
          currency: string;
        }
      | undefined;
    if (form.tradeInEnabled) {
      if (!form.tradeInBrand.trim() || !form.tradeInModel.trim()) {
        toast.error("Completá marca y modelo del vehículo en permuta");
        return;
      }
      const tradeYear = parseInt(form.tradeInYear, 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(tradeYear) || tradeYear < 1900 || tradeYear > currentYear + 1) {
        toast.error(`Año del vehículo en permuta inválido (1900 a ${currentYear + 1})`);
        return;
      }
      const tradeValue = parseFloat(form.tradeInValue);
      if (!form.tradeInValue || isNaN(tradeValue) || tradeValue <= 0) {
        toast.error("Ingresá el valor tomado por la permuta");
        return;
      }
      tradeInPayload = {
        brand: form.tradeInBrand.trim(),
        model: form.tradeInModel.trim(),
        year: tradeYear,
        value: tradeValue,
        currency: form.tradeInCurrency,
      };
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        type: "sale",
        vehicleId: form.vehicleId,
        client: {
          name: form.clientName.trim(),
          document: form.clientDocument.trim() || undefined,
          email: form.clientEmail.trim() || undefined,
          phone: form.clientPhone.trim() || undefined,
        },
        totalPrice,
        paymentMethod: form.paymentMethod,
        currency: form.currency,
        validityDays,
        notes: form.notes.trim() || undefined,
      };

      if (form.downPayment) {
        const v = parseFloat(form.downPayment);
        if (!isNaN(v) && v >= 0) payload.downPayment = v;
      }
      if (form.installments) {
        const v = parseInt(form.installments, 10);
        if (!isNaN(v) && v >= 0) payload.installments = v;
      }
      if (form.installmentAmount) {
        const v = parseFloat(form.installmentAmount);
        if (!isNaN(v) && v >= 0) payload.installmentAmount = v;
      }
      if (form.sellerName.trim()) payload.sellerName = form.sellerName.trim();
      if (tradeInPayload) payload.tradeIn = tradeInPayload;

      const res = await fetch("/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al crear la cotización");
        setSubmitting(false);
        return;
      }

      const json = await res.json();
      toast.success(`Cotización ${json.data.code} creada`);
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
        {/* Vehículo + cliente */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Combobox<VehicleOption>
              id="vehicleId"
              label="Vehículo disponible"
              placeholder="Seleccionar vehículo..."
              searchPlaceholder="Buscar por marca, modelo..."
              options={vehicles}
              value={form.vehicleId}
              onSelect={handleVehicleChange}
              loading={vehiclesLoading}
              onSearch={fetchVehicles}
              required
              emptyMessage="No hay vehículos que coincidan con la búsqueda"
              renderOption={(v) => (
                <span>
                  {v.title}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {v.year}
                  </span>
                </span>
              )}
              renderSelected={(v) => `${v.title} · ${v.year}`}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="clientName">Nombre del cliente *</Label>
                <Input
                  id="clientName"
                  value={form.clientName}
                  onChange={(e) => setField("clientName", e.target.value)}
                  placeholder="Juan Pérez"
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="clientDocument">Documento</Label>
                <Input
                  id="clientDocument"
                  value={form.clientDocument}
                  onChange={(e) =>
                    setField("clientDocument", e.target.value)
                  }
                  placeholder="DNI 30.123.456"
                  maxLength={50}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="clientEmail">Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={form.clientEmail}
                  onChange={(e) => setField("clientEmail", e.target.value)}
                  placeholder="cliente@email.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="clientPhone">Teléfono</Label>
                <Input
                  id="clientPhone"
                  value={form.clientPhone}
                  onChange={(e) => setField("clientPhone", e.target.value)}
                  placeholder="11-5555-5555"
                  maxLength={40}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Condiciones comerciales */}
        <Card>
          <CardContent className="pt-6 space-y-4">
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
                <Label htmlFor="totalPrice">Precio total *</Label>
                <Input
                  id="totalPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.totalPrice}
                  onChange={(e) => setField("totalPrice", e.target.value)}
                  placeholder="15000000"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-4">
                <Label htmlFor="paymentMethod">Forma de pago *</Label>
                <Select
                  value={form.paymentMethod}
                  onValueChange={(v) =>
                    v && setField("paymentMethod", v as QuotationPaymentMethod)
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
                <Label htmlFor="downPayment">Anticipo</Label>
                <Input
                  id="downPayment"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.downPayment}
                  onChange={(e) => setField("downPayment", e.target.value)}
                  placeholder="3000000"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-4">
                <Label htmlFor="installments">Cantidad de cuotas</Label>
                <Input
                  id="installments"
                  type="number"
                  min={0}
                  step={1}
                  value={form.installments}
                  onChange={(e) => setField("installments", e.target.value)}
                  placeholder="36"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-4">
                <Label htmlFor="installmentAmount">Valor de cada cuota</Label>
                <Input
                  id="installmentAmount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.installmentAmount}
                  onChange={(e) =>
                    setField("installmentAmount", e.target.value)
                  }
                  placeholder="350000"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-6">
                <Label htmlFor="sellerName">Vendedor</Label>
                <Input
                  id="sellerName"
                  value={form.sellerName}
                  onChange={(e) => setField("sellerName", e.target.value)}
                  placeholder="Tu nombre o el del vendedor"
                  maxLength={120}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-6">
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
                  placeholder="Condiciones adicionales, garantías, etc."
                  rows={3}
                  maxLength={2000}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permuta — toggleable */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <input
                id="tradeInEnabled"
                type="checkbox"
                checked={form.tradeInEnabled}
                onChange={(e) =>
                  setField("tradeInEnabled", e.target.checked)
                }
                className="mt-1 h-4 w-4 cursor-pointer accent-primary"
              />
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor="tradeInEnabled"
                  className="cursor-pointer text-sm font-medium"
                >
                  Entrega vehículo en parte de pago (permuta)
                </Label>
                <p className="text-xs text-muted-foreground">
                  El comprador entrega un usado por un valor pactado más el
                  saldo en pesos o dólares.
                </p>
              </div>
            </div>

            {form.tradeInEnabled && (
              <div className="grid gap-4 sm:grid-cols-12">
                <div className="space-y-1.5 sm:col-span-5">
                  <Label htmlFor="tradeInBrand">Marca *</Label>
                  <Input
                    id="tradeInBrand"
                    value={form.tradeInBrand}
                    onChange={(e) => setField("tradeInBrand", e.target.value)}
                    placeholder="Volkswagen"
                    maxLength={60}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-5">
                  <Label htmlFor="tradeInModel">Modelo *</Label>
                  <Input
                    id="tradeInModel"
                    value={form.tradeInModel}
                    onChange={(e) => setField("tradeInModel", e.target.value)}
                    placeholder="Gol Trend"
                    maxLength={120}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="tradeInYear">Año *</Label>
                  <Input
                    id="tradeInYear"
                    type="number"
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    value={form.tradeInYear}
                    onChange={(e) => setField("tradeInYear", e.target.value)}
                    placeholder="2018"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-4">
                  <Label htmlFor="tradeInCurrency">Moneda *</Label>
                  <Select
                    value={form.tradeInCurrency}
                    onValueChange={(v) =>
                      v && setField("tradeInCurrency", v)
                    }
                  >
                    <SelectTrigger id="tradeInCurrency" className="w-full">
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
                <div className="space-y-1.5 sm:col-span-8">
                  <Label htmlFor="tradeInValue">Valor tomado *</Label>
                  <Input
                    id="tradeInValue"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.tradeInValue}
                    onChange={(e) => setField("tradeInValue", e.target.value)}
                    placeholder="8500000"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            "Crear cotización"
          )}
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/dashboard/cotizaciones" />}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
