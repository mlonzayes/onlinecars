import { z } from "zod";
import { FUEL_TYPES, TRANSMISSION_TYPES, VEHICLE_CONDITIONS, VEHICLE_STATUSES, CURRENCIES } from "../constants";

export const vehicleCreateSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres").max(200),
  brand: z.string().min(1, "La marca es requerida").max(100),
  model: z.string().min(1, "El modelo es requerido").max(100),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  price: z.number().positive("El precio debe ser mayor a 0"),
  currency: z.enum(CURRENCIES).default("ARS"),
  kilometers: z.number().int().min(0).optional(),
  fuelType: z.enum(FUEL_TYPES).optional(),
  transmission: z.enum(TRANSMISSION_TYPES).optional(),
  color: z.string().max(50).optional(),
  doors: z.number().int().min(2).max(6).optional(),
  engine: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
  condition: z.enum(VEHICLE_CONDITIONS).default("used"),
  status: z.enum(VEHICLE_STATUSES).default("available"),
  featured: z.boolean().default(false),
});

export const vehicleUpdateSchema = vehicleCreateSchema.partial();

export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;
