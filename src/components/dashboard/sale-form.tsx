"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/dashboard/combobox";
import { CURRENCIES } from "@/lib/constants";

// --- Tipos simples para los combos ---

interface CustomerOption {
  id: string;
  type: string;
  firstName: string;
  lastName: string | null;
  businessName: string | null;
  documentType: string;
  documentNumber: string;
}

interface VehicleOption {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: string;
  currency: string;
  status: string;
}

// --- Sale Form ---

interface FormState {
  customerId: string;
  vehicleId: string;
  salePrice: string;
  currency: string;
  depositAmount: string;
  notes: string;
}

export function SaleForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    customerId: "",
    vehicleId: "",
    salePrice: "",
    currency: "ARS",
    depositAmount: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  // Customers combobox state
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  // Vehicles combobox state
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  // Fetch initial data on mount
  useEffect(() => {
    void fetchCustomers("");
    void fetchVehicles("");
  }, []);

  async function fetchCustomers(search: string) {
    setCustomersLoading(true);
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/clientes?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setCustomers(json.data ?? []);
      }
    } finally {
      setCustomersLoading(false);
    }
  }

  async function fetchVehicles(search: string) {
    setVehiclesLoading(true);
    try {
      const params = new URLSearchParams({ limit: "30", status: "available" });
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

  function handleField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerId || !form.vehicleId) {
      toast.error("Seleccioná un cliente y un vehículo");
      return;
    }
    if (!form.salePrice || isNaN(parseFloat(form.salePrice))) {
      toast.error("Ingresá un precio de venta válido");
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        customerId: form.customerId,
        vehicleId: form.vehicleId,
        salePrice: parseFloat(form.salePrice),
        currency: form.currency,
        notes: form.notes || undefined,
      };
      if (form.depositAmount && !isNaN(parseFloat(form.depositAmount))) {
        payload.depositAmount = parseFloat(form.depositAmount);
      }

      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Ocurrió un error. Intentá de nuevo.");
        setLoading(false);
        return;
      }

      const json = await res.json();
      toast.success("Venta creada.");
      router.push(`/dashboard/ventas/${json.data.id}`);
      router.refresh();
    } catch {
      toast.error("Error de conexión. Intentá de nuevo.");
      setLoading(false);
    }
  }

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Selector de cliente y vehículo.
            overflow-visible es necesario porque el Combobox usa un popover absolute
            que se recortaría con el overflow-hidden default del Card. */}
        <Card className="overflow-visible">
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Combobox<CustomerOption>
                id="customerId"
                label="Cliente"
                placeholder="Seleccionar cliente..."
                searchPlaceholder="Buscar por nombre o documento..."
                options={customers}
                value={form.customerId}
                onSelect={(id) => handleField("customerId", id)}
                loading={customersLoading}
                onSearch={fetchCustomers}
                required
                renderOption={(c) => {
                  const name =
                    c.type === "company"
                      ? c.businessName ?? c.firstName
                      : [c.firstName, c.lastName].filter(Boolean).join(" ");
                  return (
                    <span>
                      {name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {c.documentType} {c.documentNumber}
                      </span>
                    </span>
                  );
                }}
                renderSelected={(c) => {
                  const name =
                    c.type === "company"
                      ? c.businessName ?? c.firstName
                      : [c.firstName, c.lastName].filter(Boolean).join(" ");
                  return name;
                }}
              />

              <Combobox<VehicleOption>
                id="vehicleId"
                label="Vehículo disponible"
                placeholder="Seleccionar vehículo..."
                searchPlaceholder="Buscar por marca, modelo..."
                options={vehicles}
                value={form.vehicleId}
                onSelect={(id) => {
                  handleField("vehicleId", id);
                  // Pre-cargar el precio del vehículo como sugerencia
                  const v = vehicles.find((x) => x.id === id);
                  if (v && !form.salePrice) {
                    handleField("salePrice", v.price);
                    handleField("currency", v.currency);
                  }
                }}
                loading={vehiclesLoading}
                onSearch={fetchVehicles}
                required
                renderOption={(v) => (
                  <span>
                    {v.title}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {v.year}
                    </span>
                  </span>
                )}
                renderSelected={(v) => v.title}
              />
            </div>
          </CardContent>
        </Card>

        {/* Datos económicos */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-12">
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor="currency">Moneda</Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => v !== null && handleField("currency", v)}
                >
                  <SelectTrigger id="currency" className="w-full">
                    <SelectValue />
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
                <Label htmlFor="salePrice">
                  Precio de venta *
                  {selectedVehicle && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (publicado: {selectedVehicle.price})
                    </span>
                  )}
                </Label>
                <Input
                  id="salePrice"
                  type="number"
                  min={0}
                  step={1}
                  value={form.salePrice}
                  onChange={(e) => handleField("salePrice", e.target.value)}
                  placeholder="15000000"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-4">
                <Label htmlFor="depositAmount">Seña</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  min={0}
                  step={1}
                  value={form.depositAmount}
                  onChange={(e) => handleField("depositAmount", e.target.value)}
                  placeholder="500000"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-12">
                <Label htmlFor="notes">Notas internas</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => handleField("notes", e.target.value)}
                  placeholder="Observaciones sobre la venta..."
                  rows={3}
                  maxLength={2000}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerta de vehículo seleccionado */}
        {selectedVehicle && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <strong>Vehículo seleccionado:</strong> {selectedVehicle.title} ({selectedVehicle.year})
            {" — "}
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs">
              Al crear la venta, pasará a &quot;Reservado&quot;
            </Badge>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            "Crear venta"
          )}
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/dashboard/ventas" />}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
