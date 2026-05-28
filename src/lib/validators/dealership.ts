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
  website: z
    .string()
    .regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i, "Debe ser un dominio válido (ej: www.midominio.com)")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
});

export const dealershipUpdateSchema = dealershipCreateSchema.partial().omit({ slug: true }).extend({
  logo: z.string().url("URL de logo inválida").nullable().optional().or(z.literal("")),
  // Permiso para que roles no-admin vean costPrice de los vehículos.
  showCostsToNonAdmins: z.boolean().optional(),
  // Configuración del FAB de WhatsApp. El gating por plan se enforza
  // server-side en el handler — el validator solo valida el shape.
  whatsappFabEnabled: z.boolean().optional(),
  whatsappMessage: z.string().max(280, "Máximo 280 caracteres").optional().or(z.literal("")),
});

export type DealershipCreateInput = z.infer<typeof dealershipCreateSchema>;
export type DealershipUpdateInput = z.infer<typeof dealershipUpdateSchema>;
