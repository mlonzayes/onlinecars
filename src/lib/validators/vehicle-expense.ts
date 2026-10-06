import { z } from "zod";
import { CURRENCIES, VEHICLE_EXPENSE_CATEGORIES } from "@/lib/constants";

export const EXPENSE_DESCRIPTION_MAX = 2000;

// Gasto de reacondicionamiento de un vehículo. El monto llega como número; la
// fecha es opcional (si no viene, Prisma usa el default now()).
export const vehicleExpenseCreateSchema = z.object({
  category: z.enum(VEHICLE_EXPENSE_CATEGORIES),
  // Texto libre y largo a propósito: proveedor, qué se hizo, garantía, etc. Es el
  // detalle que después explica la ganancia neta del auto.
  description: z.string().max(EXPENSE_DESCRIPTION_MAX).optional().or(z.literal("")),
  amount: z
    .number()
    .positive("El monto debe ser mayor a 0")
    .max(1_000_000_000, "Monto demasiado alto"),
  currency: z.enum(CURRENCIES).default("ARS"),
  date: z.coerce.date().optional(),
});

export type VehicleExpenseCreateInput = z.infer<typeof vehicleExpenseCreateSchema>;
