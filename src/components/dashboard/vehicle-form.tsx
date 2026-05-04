"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Lock } from "lucide-react";
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
  VEHICLE_BODY_TYPES,
  VEHICLE_BODY_TYPE_LABELS,
  VEHICLE_CONDITIONS,
  VEHICLE_STATUSES,
  CURRENCIES,
} from "@/lib/constants";
import type { Vehicle, VehicleImage } from "@prisma/client";
import type { BlockingSale } from "@/lib/sale-guards";
import { VehicleImageUploader } from "./vehicle-image-uploader";

// `price` viene serializado como string desde el server porque Prisma usa Decimal
// y Next 15 no permite pasar objetos no-plain de Server a Client Components.
type SerializedVehicle = Omit<Vehicle, "price"> & { price: string };

interface VehicleFormProps {
  vehicle?: SerializedVehicle & { images: VehicleImage[] };
  // Si hay una venta activa sobre el vehículo, el form se renderiza en modo lectura.
  blockingSale?: BlockingSale | null;
}

const BLOCKING_SALE_LABELS: Record<BlockingSale["status"], string> = {
  reserved: "Reservada",
  in_progress: "En curso",
  completed: "Completada",
};

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
  bodyType: string;
  color: string;
  doors: string;
  engine: string;
  description: string;
}

function buildInitialState(vehicle?: SerializedVehicle): FormState {
  return {
    title: vehicle?.title ?? "",
    brand: vehicle?.brand ?? "",
    model: vehicle?.model ?? "",
    year: vehicle?.year?.toString() ?? "",
    condition: vehicle?.condition ?? "used",
    status: vehicle?.status ?? "available",
    price: vehicle?.price ?? "",
    currency: vehicle?.currency ?? "ARS",
    kilometers: vehicle?.kilometers?.toString() ?? "",
    fuelType: vehicle?.fuelType ?? "",
    transmission: vehicle?.transmission ?? "",
    bodyType: vehicle?.bodyType ?? "",
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
  disabled?: boolean;
}

function BasicInfoTab({ form, onChange, disabled }: BasicInfoTabProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-12">
      <div className="space-y-1.5 sm:col-span-12">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => onChange("title", e.target.value)}
          placeholder="Ej: Toyota Corolla XEI 2.0 2023"
          required
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-6">
        <Label htmlFor="brand">Marca *</Label>
        <Input
          id="brand"
          value={form.brand}
          onChange={(e) => onChange("brand", e.target.value)}
          placeholder="Toyota"
          required
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-6">
        <Label htmlFor="model">Modelo *</Label>
        <Input
          id="model"
          value={form.model}
          onChange={(e) => onChange("model", e.target.value)}
          placeholder="Corolla"
          required
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-4">
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
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="condition">Condición</Label>
        <Select
          value={form.condition}
          onValueChange={(v) => v !== null && onChange("condition", v)}
          disabled={disabled}
        >
          <SelectTrigger id="condition" className="w-full">
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
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="status">Estado</Label>
        <Select
          value={form.status}
          onValueChange={(v) => v !== null && onChange("status", v)}
          disabled={disabled}
        >
          <SelectTrigger id="status" className="w-full">
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
  disabled?: boolean;
}

function PriceDetailsTab({ form, onChange, disabled }: PriceDetailsTabProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-12">
      <div className="space-y-1.5 sm:col-span-8">
        <Label htmlFor="price">Precio *</Label>
        <Input
          id="price"
          type="number"
          value={form.price}
          onChange={(e) => onChange("price", e.target.value)}
          placeholder="25000000"
          min={0}
          required
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="currency">Moneda</Label>
        <Select
          value={form.currency}
          onValueChange={(v) => v !== null && onChange("currency", v)}
          disabled={disabled}
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
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="kilometers">Kilómetros</Label>
        <Input
          id="kilometers"
          type="number"
          value={form.kilometers}
          onChange={(e) => onChange("kilometers", e.target.value)}
          placeholder="50000"
          min={0}
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="fuelType">Combustible</Label>
        <Select
          value={form.fuelType}
          onValueChange={(v) => v !== null && onChange("fuelType", v)}
          disabled={disabled}
        >
          <SelectTrigger id="fuelType" className="w-full">
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
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="transmission">Transmisión</Label>
        <Select
          value={form.transmission}
          onValueChange={(v) => v !== null && onChange("transmission", v)}
          disabled={disabled}
        >
          <SelectTrigger id="transmission" className="w-full">
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
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="bodyType">Tipo de carrocería</Label>
        <Select
          value={form.bodyType}
          onValueChange={(v) => v !== null && onChange("bodyType", v)}
          disabled={disabled}
        >
          <SelectTrigger id="bodyType" className="w-full">
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent>
            {VEHICLE_BODY_TYPES.map((b) => (
              <SelectItem key={b} value={b}>
                {VEHICLE_BODY_TYPE_LABELS[b]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="color">Color</Label>
        <Input
          id="color"
          value={form.color}
          onChange={(e) => onChange("color", e.target.value)}
          placeholder="Blanco"
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="doors">Puertas</Label>
        <Input
          id="doors"
          type="number"
          value={form.doors}
          onChange={(e) => onChange("doors", e.target.value)}
          min={2}
          max={6}
          placeholder="4"
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="engine">Motor</Label>
        <Input
          id="engine"
          value={form.engine}
          onChange={(e) => onChange("engine", e.target.value)}
          placeholder="2.0L"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

// --- Componente principal ---
export function VehicleForm({ vehicle, blockingSale }: VehicleFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => buildInitialState(vehicle));
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(vehicle);
  const isLocked = !!blockingSale;

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked) return; // doble defensa, el submit ya debería estar disabled
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
      bodyType: form.bodyType || undefined,
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

      const result = (await res.json().catch(() => ({}))) as {
        data?: { id?: string };
      };
      const newId = result?.data?.id;

      toast.success(
        isEditing
          ? "Vehículo actualizado."
          : "Vehículo creado. Ahora podés agregar las imágenes."
      );
      router.push(
        isEditing || !newId
          ? "/dashboard/vehiculos"
          : `/dashboard/vehiculos/${newId}`
      );
      router.refresh();
    } catch {
      toast.error("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {isLocked && blockingSale && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Vehículo bloqueado</p>
            <p className="mt-1">
              Este vehículo tiene una venta{" "}
              <span className="font-semibold">
                {BLOCKING_SALE_LABELS[blockingSale.status]}
              </span>
              . No se pueden modificar sus datos hasta que la venta se cancele.
            </p>
            <Link
              href={`/dashboard/ventas/${blockingSale.id}`}
              className="mt-2 inline-block text-amber-900 underline underline-offset-2 hover:text-amber-700"
            >
              Ver venta →
            </Link>
          </div>
        </div>
      )}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="basico">
            <TabsList
              className={`mb-6 grid w-full ${
                isEditing ? "grid-cols-4" : "grid-cols-3"
              }`}
            >
              <TabsTrigger value="basico">Información básica</TabsTrigger>
              <TabsTrigger value="precio">Precio y detalles</TabsTrigger>
              <TabsTrigger value="descripcion">Descripción</TabsTrigger>
              {isEditing && (
                <TabsTrigger value="imagenes">Imágenes</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="basico">
              <BasicInfoTab form={form} onChange={handleChange} disabled={isLocked} />
            </TabsContent>

            <TabsContent value="precio">
              <PriceDetailsTab form={form} onChange={handleChange} disabled={isLocked} />
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
                  disabled={isLocked}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {form.description.length}/2000
                </p>
              </div>
            </TabsContent>

            {isEditing && vehicle && (
              <TabsContent value="imagenes">
                <VehicleImageUploader
                  vehicleId={vehicle.id}
                  initialImages={vehicle.images}
                  disabled={isLocked}
                />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-3">
        <Button type="submit" disabled={loading || isLocked}>
          {loading ? "Guardando..." : "Guardar"}
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/dashboard/vehiculos" />}>
          {isLocked ? "Volver" : "Cancelar"}
        </Button>
      </div>
    </form>
  );
}
