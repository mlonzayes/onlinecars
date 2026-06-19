import { z } from "zod";
import { normalizeSocialLinks } from "@/lib/social";

// Input crudo de las redes: el dealer carga handle o URL. La normalización a URL
// absoluta (y el descarte de vacíos) se hace en el transform → guardamos limpio.
const socialLinksInputSchema = z
  .object({
    instagram: z.string().max(200).optional(),
    facebook: z.string().max(200).optional(),
    tiktok: z.string().max(200).optional(),
    x: z.string().max(200).optional(),
    threads: z.string().max(200).optional(),
  })
  .transform((val) => normalizeSocialLinks(val));

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
  // Dirección requerida en el onboarding (ML pide ubicación a nivel ciudad
  // para publicar vehículos, y el footer del sitio público la muestra).
  // El dealership.update sigue tratándolos como optional (via .partial() abajo)
  // — solo el create/onboarding los exige.
  address: z.string().min(3, "La dirección es requerida").max(300),
  city: z.string().min(2, "La ciudad es requerida").max(100),
  province: z.string().min(2, "La provincia es requerida").max(100),
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
  // Plus en pesos sobre la cotización oficial. Se gatea admin-only en el handler
  // (igual que showCostsToNonAdmins). Cap razonable para evitar valores absurdos.
  usdSpread: z.number().min(0, "No puede ser negativo").max(1_000_000).optional(),
  // Configuración del FAB de WhatsApp. El gating por plan se enforza
  // server-side en el handler — el validator solo valida el shape.
  whatsappFabEnabled: z.boolean().optional(),
  whatsappMessage: z.string().max(280, "Máximo 280 caracteres").optional().or(z.literal("")),
  // Toggle del sitio público {slug}.motorflowapp.com. Default DB false — el
  // dealer lo activa cuando esté listo para lanzar.
  siteEnabled: z.boolean().optional(),
  // Plantilla visual del sitio público. Valores válidos viven en
  // src/lib/tenant-templates.ts (TENANT_TEMPLATE_IDS). El runtime hace fallback
  // a "classic" si llega cualquier otro string — el validador acá es solo el
  // primer filtro.
  templateId: z.enum(["classic", "dark"]).optional(),
  // Ubicación del mapa. Las coords las resuelve el buscador de geocoding del
  // dashboard — el validador solo chequea rangos. mapLabel vacío → null.
  // La visibilidad del mapa NO vive acá: la maneja el config de la sección Contacto.
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  mapLabel: z
    .string()
    .max(300)
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  // Redes sociales. El transform normaliza a URLs y descarta vacíos (devuelve
  // null si no quedó ninguna). nullable permite limpiarlas todas.
  socialLinks: socialLinksInputSchema.nullable().optional(),
});

export type DealershipCreateInput = z.infer<typeof dealershipCreateSchema>;
export type DealershipUpdateInput = z.infer<typeof dealershipUpdateSchema>;
