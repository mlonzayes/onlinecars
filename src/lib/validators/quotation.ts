import { z } from "zod";
import {
  CURRENCIES,
  DEFAULT_QUOTATION_VALIDITY_DAYS,
  FUEL_TYPES,
  QUOTATION_PAYMENT_METHODS,
  QUOTATION_STATUSES,
  QUOTATION_TYPES,
  TRANSMISSION_TYPES,
  VEHICLE_CONDITIONS,
} from "../constants";

// Campos comunes a ambos tipos de cotización (venta y compra).
const baseCreateSchema = z.object({
  currency: z.enum(CURRENCIES).default("ARS"),
  validityDays: z
    .number()
    .int()
    .positive()
    .max(365)
    .default(DEFAULT_QUOTATION_VALIDITY_DAYS),
  notes: z.string().trim().max(2000).optional(),
});

// Permuta — vehículo entregado en parte de pago. Si se incluye, todos los
// campos identificatorios (marca/modelo/año) y económicos (valor/moneda) son
// requeridos para que la cotización tenga sentido.
export const tradeInSchema = z.object({
  brand: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(120),
  year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  value: z.number().positive("Debe ser mayor que cero"),
  currency: z.enum(CURRENCIES),
});

// Cotización de venta: vincula un vehículo del stock con un cliente potencial
// y describe la operación comercial propuesta.
export const saleQuotationCreateSchema = baseCreateSchema.extend({
  type: z.literal("sale"),
  vehicleId: z.string().min(1, "Seleccioná un vehículo"),
  client: z.object({
    name: z.string().trim().min(2, "Mínimo 2 caracteres").max(120),
    document: z.string().trim().max(50).optional(),
    email: z.union([z.string().email(), z.literal("")]).optional(),
    phone: z.string().trim().max(40).optional(),
  }),
  totalPrice: z.number().positive("Debe ser mayor que cero"),
  downPayment: z.number().nonnegative().optional(),
  installments: z.number().int().nonnegative().optional(),
  installmentAmount: z.number().nonnegative().optional(),
  paymentMethod: z.enum(QUOTATION_PAYMENT_METHODS),
  sellerName: z.string().trim().max(120).optional(),
  tradeIn: tradeInSchema.optional(),
});

// Cotización de compra (tasación): el concesionario ofrece comprar un vehículo
// que NO está en stock. Puede o no estar asociada a un Lead previo.
export const purchaseQuotationCreateSchema = baseCreateSchema.extend({
  type: z.literal("purchase"),
  leadId: z.string().min(1).optional(),
  seller: z.object({
    name: z.string().trim().min(2).max(120),
    document: z.string().trim().max(50).optional(),
    email: z.union([z.string().email(), z.literal("")]).optional(),
    phone: z.string().trim().max(40).optional(),
  }),
  vehicle: z.object({
    brand: z.string().trim().min(1).max(60),
    model: z.string().trim().min(1).max(120),
    year: z
      .number()
      .int()
      .min(1900)
      .max(new Date().getFullYear() + 1),
    version: z.string().trim().max(120).optional(),
    kilometers: z.number().int().nonnegative().optional(),
    color: z.string().trim().max(40).optional(),
    transmission: z.enum(TRANSMISSION_TYPES).optional(),
    fuelType: z.enum(FUEL_TYPES).optional(),
    condition: z.enum(VEHICLE_CONDITIONS).optional(),
  }),
  offerAmount: z.number().positive(),
  paymentMethod: z.enum(QUOTATION_PAYMENT_METHODS),
});

// Union discriminada por `type` — Zod elige el schema correcto según el valor.
export const quotationCreateSchema = z.discriminatedUnion("type", [
  saleQuotationCreateSchema,
  purchaseQuotationCreateSchema,
]);

export type QuotationCreateInput = z.infer<typeof quotationCreateSchema>;
export type SaleQuotationCreateInput = z.infer<typeof saleQuotationCreateSchema>;
export type PurchaseQuotationCreateInput = z.infer<typeof purchaseQuotationCreateSchema>;

// Update LIGHT: cambios chicos sobre una cotización (notas, extender validez).
// Lo usan los botones rápidos del detail. NO toca campos sensibles.
export const quotationUpdateSchema = z.object({
  notes: z.string().trim().max(2000).nullable().optional(),
  validUntil: z.string().datetime().optional(),
});

export type QuotationUpdateInput = z.infer<typeof quotationUpdateSchema>;

// Edit FULL: reescritura completa de una cotización pending. Reutiliza el
// shape del create — el dealer corrige typos (precio, cliente, vehículo, etc.)
// y se aplica como overwrite. NO regenera el `code` ni el `emittedAt`. Solo
// permitido sobre cotizaciones en estado `pending` (enforced en el handler).
//
// Discriminated union igual al create. `validityDays` opcional acá: si no se
// pasa, mantenemos el validUntil actual; si se pasa, recalculamos.
const saleQuotationEditSchema = saleQuotationCreateSchema.extend({
  validityDays: z.number().int().positive().max(365).optional(),
});

const purchaseQuotationEditSchema = purchaseQuotationCreateSchema.extend({
  validityDays: z.number().int().positive().max(365).optional(),
});

export const quotationEditSchema = z.discriminatedUnion("type", [
  saleQuotationEditSchema,
  purchaseQuotationEditSchema,
]);

export type QuotationEditInput = z.infer<typeof quotationEditSchema>;

// Solo se aceptan transiciones explícitas desde pending. expired se computa
// en lectura (ver quotation-status.ts) y no es un valor que se setee por API.
export const quotationStatusUpdateSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
});

export type QuotationStatusUpdateInput = z.infer<typeof quotationStatusUpdateSchema>;

export const quotationListQuerySchema = z.object({
  type: z.enum(QUOTATION_TYPES).optional(),
  status: z.enum(QUOTATION_STATUSES).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type QuotationListQuery = z.infer<typeof quotationListQuerySchema>;
