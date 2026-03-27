import { z } from "zod";

export const dealershipCreateSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(200),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  description: z.string().max(500).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal("")),
  whatsapp: z.string().max(30).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal("")),
});

export const dealershipUpdateSchema = dealershipCreateSchema.partial().omit({ slug: true });

export type DealershipCreateInput = z.infer<typeof dealershipCreateSchema>;
export type DealershipUpdateInput = z.infer<typeof dealershipUpdateSchema>;
