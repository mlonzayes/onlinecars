import { z } from "zod";
import { CURRENCIES } from "@/lib/constants";

// Pago de suscripción que el super-admin registra para un tenant. Monto libre.
export const subscriptionPaymentCreateSchema = z.object({
  amount: z
    .number()
    .positive("El monto debe ser mayor a 0")
    .max(100_000_000, "Monto demasiado alto"),
  currency: z.enum(CURRENCIES).default("ARS"),
  method: z.string().max(50).optional().or(z.literal("")),
  notes: z.string().max(300).optional().or(z.literal("")),
});

export type SubscriptionPaymentCreateInput = z.infer<
  typeof subscriptionPaymentCreateSchema
>;
