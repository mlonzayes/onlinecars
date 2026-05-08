"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import {
  useForm,
  Controller,
  type UseFormRegister,
  type Control,
  type FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  FUEL_TYPE_LABELS,
  TRANSMISSION_TYPES,
  TRANSMISSION_TYPE_LABELS,
  VEHICLE_BODY_TYPES,
  VEHICLE_BODY_TYPE_LABELS,
  VEHICLE_CONDITIONS,
  VEHICLE_CONDITION_LABELS,
  VEHICLE_STATUSES,
  VEHICLE_STATUS_LABELS,
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

// Schema interno del form: los inputs HTML devuelven strings, así que coercionamos
// a number en los campos numéricos. La validación al server vive en
// vehicleCreateSchema (lib/validators/vehicle.ts) y opera sobre números nativos.
const optionalIntFromString = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().int().optional()
);

const vehicleFormSchema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres").max(200, "Máximo 200"),
  brand: z.string().min(1, "La marca es requerida").max(100),
  model: z.string().min(1, "El modelo es requerido").max(100),
  year: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z
      .number({ message: "Año requerido" })
      .int()
      .min(1900, "Año mínimo: 1900")
      .max(new Date().getFullYear() + 1, "Año futuro inválido")
  ),
  condition: z.enum(VEHICLE_CONDITIONS),
  status: z.enum(VEHICLE_STATUSES),
  price: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number({ message: "Precio requerido" }).positive("El precio debe ser mayor a 0")
  ),
  currency: z.enum(CURRENCIES),
  kilometers: optionalIntFromString.pipe(
    z.number().int().min(0, "No puede ser negativo").optional()
  ),
  // Para los enums opcionales, "" representa "no seleccionado" en el form
  // y se transforma a undefined al enviar.
  fuelType: z.union([z.enum(FUEL_TYPES), z.literal("")]).optional(),
  transmission: z.union([z.enum(TRANSMISSION_TYPES), z.literal("")]).optional(),
  bodyType: z.union([z.enum(VEHICLE_BODY_TYPES), z.literal("")]).optional(),
  color: z.string().max(50).optional(),
  doors: optionalIntFromString.pipe(
    z.number().int().min(2, "Mínimo 2").max(6, "Máximo 6").optional()
  ),
  engine: z.string().max(50).optional(),
  // Patente argentina opcional. Acepta formato viejo (AAA000) y nuevo Mercosur
  // (AA000AA), sin importar mayúsculas/minúsculas ni guiones/espacios.
  licensePlate: z
    .string()
    .max(20)
    .optional()
    .refine(
      (v) => {
        if (!v) return true;
        const cleaned = v.replace(/[\s-]/g, "").toUpperCase();
        return /^[A-Z]{3}\d{3}$/.test(cleaned) || /^[A-Z]{2}\d{3}[A-Z]{2}$/.test(cleaned);
      },
      "Formato inválido. Esperado AAA000 (vieja) o AA000AA (Mercosur)."
    ),
  description: z.string().max(2000).optional(),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

function buildDefaults(vehicle?: SerializedVehicle): VehicleFormValues {
  return {
    title: vehicle?.title ?? "",
    brand: vehicle?.brand ?? "",
    model: vehicle?.model ?? "",
    year: vehicle?.year ?? (new Date().getFullYear() as VehicleFormValues["year"]),
    condition: (vehicle?.condition as VehicleFormValues["condition"]) ?? "used",
    status: (vehicle?.status as VehicleFormValues["status"]) ?? "available",
    price: vehicle?.price ? Number(vehicle.price) : (undefined as unknown as VehicleFormValues["price"]),
    currency: (vehicle?.currency as VehicleFormValues["currency"]) ?? "ARS",
    kilometers: vehicle?.kilometers ?? undefined,
    fuelType: (vehicle?.fuelType as VehicleFormValues["fuelType"]) ?? "",
    transmission: (vehicle?.transmission as VehicleFormValues["transmission"]) ?? "",
    bodyType: (vehicle?.bodyType as VehicleFormValues["bodyType"]) ?? "",
    color: vehicle?.color ?? "",
    doors: vehicle?.doors ?? undefined,
    engine: vehicle?.engine ?? "",
    licensePlate: vehicle?.licensePlate ?? "",
    description: vehicle?.description ?? "",
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-600 mt-1">{message}</p>;
}

// Helper para extraer el mensaje de error de un campo del form.
function errorMessage(
  errors: FieldErrors<VehicleFormValues>,
  name: keyof VehicleFormValues
): string | undefined {
  return errors[name]?.message;
}

// --- Sub-componente: Tab de información básica ---
interface TabSectionProps {
  register: UseFormRegister<VehicleFormValues>;
  control: Control<VehicleFormValues>;
  errors: FieldErrors<VehicleFormValues>;
  disabled?: boolean;
}

function BasicInfoTab({ register, control, errors, disabled }: TabSectionProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-12">
      <div className="space-y-1.5 sm:col-span-12">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          placeholder="Ej: Toyota Corolla XEI 2.0 2023"
          disabled={disabled}
          aria-invalid={!!errors.title}
          {...register("title")}
        />
        <FieldError message={errorMessage(errors, "title")} />
      </div>
      <div className="space-y-1.5 sm:col-span-6">
        <Label htmlFor="brand">Marca *</Label>
        <Input
          id="brand"
          placeholder="Toyota"
          disabled={disabled}
          aria-invalid={!!errors.brand}
          {...register("brand")}
        />
        <FieldError message={errorMessage(errors, "brand")} />
      </div>
      <div className="space-y-1.5 sm:col-span-6">
        <Label htmlFor="model">Modelo *</Label>
        <Input
          id="model"
          placeholder="Corolla"
          disabled={disabled}
          aria-invalid={!!errors.model}
          {...register("model")}
        />
        <FieldError message={errorMessage(errors, "model")} />
      </div>
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="year">Año *</Label>
        <Input
          id="year"
          type="number"
          placeholder="2023"
          min={1900}
          max={new Date().getFullYear() + 1}
          disabled={disabled}
          aria-invalid={!!errors.year}
          {...register("year")}
        />
        <FieldError message={errorMessage(errors, "year")} />
      </div>
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="condition">Condición</Label>
        <Controller
          control={control}
          name="condition"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(v) => v !== null && field.onChange(v)}
              disabled={disabled}
            >
              <SelectTrigger id="condition" className="w-full">
                <SelectValue>{VEHICLE_CONDITION_LABELS[field.value]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_CONDITIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {VEHICLE_CONDITION_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={errorMessage(errors, "condition")} />
      </div>
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="status">Estado</Label>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(v) => v !== null && field.onChange(v)}
              disabled={disabled}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue>{VEHICLE_STATUS_LABELS[field.value]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {VEHICLE_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={errorMessage(errors, "status")} />
      </div>
      <div className="space-y-1.5 sm:col-span-12">
        <Label htmlFor="licensePlate">Patente</Label>
        <Input
          id="licensePlate"
          placeholder="Ej: AC123BD (Mercosur) o ABC123 (vieja)"
          disabled={disabled}
          aria-invalid={!!errors.licensePlate}
          {...register("licensePlate")}
        />
        <FieldError message={errorMessage(errors, "licensePlate")} />
        <p className="text-xs text-muted-foreground">
          Útil para identificar el vehículo cuando hay varios similares en stock. En 0 km dejala vacía si todavía no se patentó.
        </p>
      </div>
    </div>
  );
}

// --- Sub-componente: Tab de precio y detalles ---
function PriceDetailsTab({ register, control, errors, disabled }: TabSectionProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-12">
      <div className="space-y-1.5 sm:col-span-8">
        <Label htmlFor="price">Precio *</Label>
        <Input
          id="price"
          type="number"
          placeholder="25000000"
          min={0}
          disabled={disabled}
          aria-invalid={!!errors.price}
          {...register("price")}
        />
        <FieldError message={errorMessage(errors, "price")} />
      </div>
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="currency">Moneda</Label>
        <Controller
          control={control}
          name="currency"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(v) => v !== null && field.onChange(v)}
              disabled={disabled}
            >
              <SelectTrigger id="currency" className="w-full">
                <SelectValue>{field.value}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="kilometers">Kilómetros</Label>
        <Input
          id="kilometers"
          type="number"
          placeholder="50000"
          min={0}
          disabled={disabled}
          aria-invalid={!!errors.kilometers}
          {...register("kilometers")}
        />
        <FieldError message={errorMessage(errors, "kilometers")} />
      </div>
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="fuelType">Combustible</Label>
        <Controller
          control={control}
          name="fuelType"
          render={({ field }) => (
            <Select
              value={field.value ?? ""}
              onValueChange={(v) => v !== null && field.onChange(v || "")}
              disabled={disabled}
            >
              <SelectTrigger id="fuelType" className="w-full">
                <SelectValue placeholder="Seleccionar">
                  {field.value ? FUEL_TYPE_LABELS[field.value as keyof typeof FUEL_TYPE_LABELS] : "Seleccionar"}
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
          )}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="transmission">Transmisión</Label>
        <Controller
          control={control}
          name="transmission"
          render={({ field }) => (
            <Select
              value={field.value ?? ""}
              onValueChange={(v) => v !== null && field.onChange(v || "")}
              disabled={disabled}
            >
              <SelectTrigger id="transmission" className="w-full">
                <SelectValue placeholder="Seleccionar">
                  {field.value
                    ? TRANSMISSION_TYPE_LABELS[field.value as keyof typeof TRANSMISSION_TYPE_LABELS]
                    : "Seleccionar"}
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
          )}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="bodyType">Tipo de carrocería</Label>
        <Controller
          control={control}
          name="bodyType"
          render={({ field }) => (
            <Select
              value={field.value ?? ""}
              onValueChange={(v) => v !== null && field.onChange(v || "")}
              disabled={disabled}
            >
              <SelectTrigger id="bodyType" className="w-full">
                <SelectValue placeholder="Seleccionar">
                  {field.value
                    ? VEHICLE_BODY_TYPE_LABELS[field.value as keyof typeof VEHICLE_BODY_TYPE_LABELS]
                    : "Seleccionar"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_BODY_TYPES.map((b) => (
                  <SelectItem key={b} value={b}>
                    {VEHICLE_BODY_TYPE_LABELS[b]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="color">Color</Label>
        <Input
          id="color"
          placeholder="Blanco"
          disabled={disabled}
          {...register("color")}
        />
        <FieldError message={errorMessage(errors, "color")} />
      </div>
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="doors">Puertas</Label>
        <Input
          id="doors"
          type="number"
          min={2}
          max={6}
          placeholder="4"
          disabled={disabled}
          aria-invalid={!!errors.doors}
          {...register("doors")}
        />
        <FieldError message={errorMessage(errors, "doors")} />
      </div>
      <div className="space-y-1.5 sm:col-span-4">
        <Label htmlFor="engine">Motor</Label>
        <Input
          id="engine"
          placeholder="2.0L"
          disabled={disabled}
          {...register("engine")}
        />
        <FieldError message={errorMessage(errors, "engine")} />
      </div>
    </div>
  );
}

// --- Componente principal ---
const VEHICLE_FORM_TABS = ["basico", "precio", "descripcion", "imagenes"] as const;
type VehicleFormTab = (typeof VEHICLE_FORM_TABS)[number];

function isVehicleFormTab(value: string | null): value is VehicleFormTab {
  return value !== null && (VEHICLE_FORM_TABS as readonly string[]).includes(value);
}

export function VehicleForm({ vehicle, blockingSale }: VehicleFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(vehicle);
  const isLocked = !!blockingSale;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: buildDefaults(vehicle),
    mode: "onBlur",
  });

  // Para mostrar el contador de chars de la descripción.
  const description = watch("description") ?? "";

  const requestedTab = searchParams?.get("tab") ?? null;
  const initialTab: VehicleFormTab =
    isVehicleFormTab(requestedTab) && (requestedTab !== "imagenes" || isEditing)
      ? requestedTab
      : "basico";

  const onSubmit = handleSubmit(async (data) => {
    if (isLocked) return;
    setSubmitting(true);

    // Limpiamos enums vacíos a undefined para que el server no intente
    // guardar "" en columnas con enum string.
    const payload = {
      title: data.title,
      brand: data.brand,
      model: data.model,
      year: data.year,
      condition: data.condition,
      status: data.status,
      price: data.price,
      currency: data.currency,
      kilometers: data.kilometers,
      fuelType: data.fuelType || undefined,
      transmission: data.transmission || undefined,
      bodyType: data.bodyType || undefined,
      color: data.color || undefined,
      doors: data.doors,
      engine: data.engine || undefined,
      // Normalizamos la patente a mayúsculas sin separadores antes de mandar.
      licensePlate: data.licensePlate
        ? data.licensePlate.replace(/[\s-]/g, "").toUpperCase()
        : undefined,
      description: data.description || undefined,
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
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Ocurrió un error. Intentá de nuevo.");
        setSubmitting(false);
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
      // No bajamos submitting en éxito — el router.push es asíncrono y el botón
      // se reactivaría mientras la página todavía está visible (regla 14).
      router.push(
        isEditing || !newId
          ? "/dashboard/vehiculos"
          : `/dashboard/vehiculos/${newId}?tab=imagenes`
      );
      router.refresh();
    } catch {
      toast.error("Error de conexión. Intentá de nuevo.");
      setSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit}>
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
          <Tabs defaultValue={initialTab}>
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
              <BasicInfoTab
                register={register}
                control={control}
                errors={errors}
                disabled={isLocked}
              />
            </TabsContent>

            <TabsContent value="precio">
              <PriceDetailsTab
                register={register}
                control={control}
                errors={errors}
                disabled={isLocked}
              />
            </TabsContent>

            <TabsContent value="descripcion">
              <div className="space-y-1.5">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Describí el vehículo: equipamiento, estado, extras..."
                  rows={8}
                  maxLength={2000}
                  disabled={isLocked}
                  aria-invalid={!!errors.description}
                  {...register("description")}
                />
                <FieldError message={errorMessage(errors, "description")} />
                <p className="text-xs text-muted-foreground text-right">
                  {description.length}/2000
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
        <Button type="submit" disabled={submitting || isLocked}>
          {submitting ? "Guardando..." : "Guardar"}
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/dashboard/vehiculos" />}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
