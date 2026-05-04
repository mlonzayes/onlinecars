import { z } from "zod";
import { CURRENCIES, SALE_STATUSES } from "@/lib/constants";

// Monto en número positivo (el frontend manda number, Prisma guarda Decimal).
const amountSchema = z.number().positive("Debe ser mayor a 0");

export const saleCreateSchema = z.object({
  vehicleId: z.string().min(1, "Seleccioná un vehículo"),
  customerId: z.string().min(1, "Seleccioná un cliente"),
  salePrice: amountSchema,
  currency: z.enum(CURRENCIES).default("ARS"),
  depositAmount: amountSchema.optional(),
  depositDate: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
});

export const saleUpdateSchema = z.object({
  salePrice: amountSchema.optional(),
  currency: z.enum(CURRENCIES).optional(),
  depositAmount: amountSchema.optional(),
  depositDate: z.string().datetime().nullable().optional(),
  invoiceNumber: z.string().max(50).optional(),
  invoiceDate: z.string().datetime().nullable().optional(),
  deliveryDate: z.string().datetime().nullable().optional(),
  notes: z.string().max(2000).optional(),
});

// Transición de estado — válida en la ruta /api/ventas/[id]/status
const CANCEL_STATUSES = ["cancelled"] as const;
const FORWARD_STATUSES = ["reserved", "in_progress", "completed"] as const;

export const saleStatusSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.enum(FORWARD_STATUSES),
  }),
  z.object({
    status: z.enum(CANCEL_STATUSES),
    cancelReason: z.string().min(1, "El motivo de cancelación es requerido").max(500),
  }),
]);

export type SaleCreateInput = z.infer<typeof saleCreateSchema>;
export type SaleUpdateInput = z.infer<typeof saleUpdateSchema>;
export type SaleStatusInput = z.infer<typeof saleStatusSchema>;
