import { z } from "zod";
import { FUEL_TYPES, TRANSMISSION_TYPES, VEHICLE_BODY_TYPES, VEHICLE_CONDITIONS, VEHICLE_STATUSES, CURRENCIES } from "../constants";

// Campos SIN defaults. Los defaults van solo en el create: en Zod 4 un
// `.default()` sigue aplicando dentro de `.partial()`, así que un update parcial
// (ej: solo `featured`) pisaba currency, condition y status con sus defaults.
const vehicleFields = {
  title: z.string().min(3, "El título debe tener al menos 3 caracteres").max(200),
  brand: z.string().min(1, "La marca es requerida").max(100),
  model: z.string().min(1, "El modelo es requerido").max(100),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  price: z.number().positive("El precio debe ser mayor a 0"),
  currency: z.enum(CURRENCIES),
  // Precio de costo (compra). Solo admins pueden setearlo — el servicio valida el role.
  costPrice: z.number().positive("El costo debe ser mayor a 0").optional(),
  costCurrency: z.enum(CURRENCIES).optional(),
  kilometers: z.number().int().min(0).optional(),
  fuelType: z.enum(FUEL_TYPES).optional(),
  transmission: z.enum(TRANSMISSION_TYPES).optional(),
  bodyType: z.enum(VEHICLE_BODY_TYPES).optional(),
  color: z.string().max(50).optional(),
  doors: z.number().int().min(2).max(6).optional(),
  engine: z.string().max(50).optional(),
  vin: z.string().max(50).optional(),
  motorNumber: z.string().max(50).optional(),
  licensePlate: z.string().max(20).optional(),
  description: z.string().max(2000).optional(),
  condition: z.enum(VEHICLE_CONDITIONS),
  status: z.enum(VEHICLE_STATUSES),
  featured: z.boolean(),
  // Stock ilimitado (0km): al vender no se bloquea ni cambia de status.
  unlimitedStock: z.boolean(),
};

export const vehicleCreateSchema = z.object({
  ...vehicleFields,
  currency: vehicleFields.currency.default("ARS"),
  condition: vehicleFields.condition.default("used"),
  status: vehicleFields.status.default("available"),
  featured: vehicleFields.featured.default(false),
  unlimitedStock: vehicleFields.unlimitedStock.default(false),
});

// Solo trae los campos que vinieron en el body: lo que no se manda no se toca.
export const vehicleUpdateSchema = z.object(vehicleFields).partial().extend({
  publishedAt: z.string().datetime().nullable().optional(),
});

export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;
