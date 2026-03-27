"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  FUEL_TYPES,
  TRANSMISSION_TYPES,
  VEHICLE_CONDITIONS,
  VEHICLE_STATUSES,
  CURRENCIES,
} from "@/lib/constants";
import type { Vehicle, VehicleImage } from "@prisma/client";

interface VehicleFormProps {
  vehicle?: Vehicle & { images: VehicleImage[] };
}

// Tipo del estado del formulario (todos strings para los inputs)
interface FormState {
  title: string;
  brand: string;
  model: string;
  year: string;
  condition: string;
  status: string;
  price: string;
  currency: string;
  kilometers: string;
  fuelType: string;
  transmission: string;
  color: string;
  doors: string;
  engine: string;
  description: string;
}

function buildInitialState(vehicle?: Vehicle): FormState {
  return {
    title: vehicle?.title ?? "",
    brand: vehicle?.brand ?? "",
    model: vehicle?.model ?? "",
    year: vehicle?.year?.toString() ?? "",
    condition: vehicle?.condition ?? "used",
    status: vehicle?.status ?? "available",
    price: vehicle?.price?.toString() ?? "",
    currency: vehicle?.currency ?? "ARS",
    kilometers: vehicle?.kilometers?.toString() ?? "",
    fuelType: vehicle?.fuelType ?? "",
    transmission: vehicle?.transmission ?? "",
    color: vehicle?.color ?? "",
    doors: vehicle?.doors?.toString() ?? "",
    engine: vehicle?.engine ?? "",
    description: vehicle?.description ?? "",
  };
}

// --- Sub-componente: Tab de información básica ---
interface BasicInfoTabProps {
  form: FormState;
  onChange: (field: keyof FormState, value: string) => void;
}

function BasicInfoTab({ form, onChange }: BasicInfoTabProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2 space-y-1.5">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => onChange("title", e.target.value)}
          placeholder="Ej: Toyota Corolla XEI 2.0 2023"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="brand">Marca *</Label>
        <Input
          id="brand"
          value={form.brand}
          onChange={(e) => onChange("brand", e.target.value)}
          placeholder="Toyota"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="model">Modelo *</Label>
        <Input
          id="model"
          value={form.model}
          onChange={(e) => onChange("model", e.target.value)}
          placeholder="Corolla"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="year">Año *</Label>
        <Input
          id="year"
          type="number"
          value={form.year}
          onChange={(e) => onChange("year", e.target.value)}
          placeholder="2023"
          min={1900}
          max={new Date().getFullYear() + 1}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="condition">Condición</Label>
        <Select value={form.condition} onValueChange={(v) => onChange("condition", v)}>
          <SelectTrigger id="condition">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VEHICLE_CONDITIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {c === "new" ? "Nuevo" : "Usado"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="status">Estado</Label>
        <Select value={form.status} onValueChange={(v) => onChange("status", v)}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VEHICLE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "available" ? "Disponible" : s === "reserved" ? "Reservado" : "Vendido"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// --- Sub-componente: Tab de precio y detalles ---
interface PriceDetailsTabProps {
  form: FormState;
  onChange: (field: keyof FormState, value: string) => void;
}

function PriceDetailsTab({ form, onChange }: PriceDetailsTabProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="price">Precio *</Label>
        <Input
          id="price"
          type="number"
          value={form.price}
          onChange={(e) => onChange("price", e.target.value)}
          placeholder="25000000"
          min={0}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="currency">Moneda</Label>
        <Select value={form.currency} onValueChange={(v) => onChange("currency", v)}>
          <SelectTrigger id="currency">
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
      <div className="space-y-1.5">
        <Label htmlFor="kilometers">Kilómetros</Label>
        <Input
          id="kilometers"
          type="number"
          value={form.kilometers}
          onChange={(e) => onChange("kilometers", e.target.value)}
          placeholder="50000"
          min={0}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fuelType">Combustible</Label>
        <Select value={form.fuelType} onValueChange={(v) => onChange("fuelType", v)}>
          <SelectTrigger id="fuelType">
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent>
            {FUEL_TYPES.map((f) => (
              <SelectItem key={f} value={f}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="transmission">Transmisión</Label>
        <Select value={form.transmission} onValueChange={(v) => onChange("transmission", v)}>
          <SelectTrigger id="transmission">
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent>
            {TRANSMISSION_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t === "manual" ? "Manual" : "Automática"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="color">Color</Label>
        <Input
          id="color"
          value={form.color}
          onChange={(e) => onChange("color", e.target.value)}
          placeholder="Blanco"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="doors">Puertas</Label>
        <Input
          id="doors"
          type="number"
          value={form.doors}
          onChange={(e) => onChange("doors", e.target.value)}
          min={2}
          max={6}
          placeholder="4"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="engine">Motor</Label>
        <Input
          id="engine"
          value={form.engine}
          onChange={(e) => onChange("engine", e.target.value)}
          placeholder="2.0L"
        />
      </div>
    </div>
  );
}

// --- Componente principal ---
export function VehicleForm({ vehicle }: VehicleFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => buildInitialState(vehicle));
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(vehicle);

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      title: form.title,
      brand: form.brand,
      model: form.model,
      year: parseInt(form.year, 10),
      condition: form.condition,
      status: form.status,
      price: parseFloat(form.price),
      currency: form.currency,
      kilometers: form.kilometers ? parseInt(form.kilometers, 10) : undefined,
      fuelType: form.fuelType || undefined,
      transmission: form.transmission || undefined,
      color: form.color || undefined,
      doors: form.doors ? parseInt(form.doors, 10) : undefined,
      engine: form.engine || undefined,
      description: form.description || undefined,
    };

    try {
      const url = isEditing ? `/api/vehiculos/${vehicle!.id}` : "/api/vehiculos";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Ocurrió un error. Intentá de nuevo.");
        return;
      }

      toast.success(isEditing ? "Vehículo actualizado." : "Vehículo creado.");
      router.push("/dashboard/vehiculos");
      router.refresh();
    } catch {
      toast.error("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="basico">
            <TabsList className="mb-6 grid w-full grid-cols-3">
              <TabsTrigger value="basico">Información básica</TabsTrigger>
              <TabsTrigger value="precio">Precio y detalles</TabsTrigger>
              <TabsTrigger value="descripcion">Descripción</TabsTrigger>
            </TabsList>

            <TabsContent value="basico">
              <BasicInfoTab form={form} onChange={handleChange} />
            </TabsContent>

            <TabsContent value="precio">
              <PriceDetailsTab form={form} onChange={handleChange} />
            </TabsContent>

            <TabsContent value="descripcion">
              <div className="space-y-1.5">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Describí el vehículo: equipamiento, estado, extras..."
                  rows={8}
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {form.description.length}/2000
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/vehiculos">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
