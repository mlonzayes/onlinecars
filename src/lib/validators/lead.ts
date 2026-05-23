import { z } from "zod";
import { LEAD_SOURCES } from "../constants";

// Datos del vehículo a tasar que vienen del form público de "Cotizá tu vehículo".
// Se persisten en Lead.quoteData (Json) cuando source=tasacion.
export const leadQuoteVehicleSchema = z.object({
  brand: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(120),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  version: z.string().trim().max(120).optional(),
  kilometers: z.number().int().nonnegative().optional(),
  color: z.string().trim().max(40).optional(),
  fuelType: z.string().trim().max(40).optional(),
  transmission: z.string().trim().max(40).optional(),
});

export type LeadQuoteVehicle = z.infer<typeof leadQuoteVehicleSchema>;

export const leadCreateSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(200),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  message: z.string().max(1000).optional(),
  vehicleId: z.string().cuid().optional(),
  source: z.enum(LEAD_SOURCES).default("web"),
  quote: leadQuoteVehicleSchema.optional(),
});

export type LeadCreateInput = z.infer<typeof leadCreateSchema>;
