import { z } from "zod";
import { DEALERSHIP_PLANS } from "@/lib/constants";
import { TENANT_TEMPLATE_ID_TUPLE } from "@/lib/tenant-templates";

// Acciones del super-admin sobre una cuenta (dealership). Dos grupos:
//
//  1. Comerciales — plan y habilitado/suspendido.
//  2. Sitio público — siteEnabled y templateId. El super-admin los toca para
//     lanzar/pausar el sitio de un cliente y para dejarle aplicada la plantilla
//     que le armó. Son los MISMOS campos que el dealer edita en su panel: acá
//     no hay una lógica paralela, solo otro operador.
//
// El resto de los campos del dealership se editan desde el panel del propio
// tenant, no desde acá.
export const adminDealershipUpdateSchema = z
  .object({
    plan: z.enum(DEALERSHIP_PLANS).optional(),
    // El super-admin solo habilita (active) o deshabilita (suspended) una cuenta.
    subscriptionStatus: z.enum(["active", "suspended"]).optional(),
    // Prende/apaga el sitio público {slug}.motorflowapp.com. Con false, TODAS
    // las rutas públicas del tenant responden 404 (ver getDealershipBySlug).
    siteEnabled: z.boolean().optional(),
    // Plantilla visual. Lista derivada de TENANT_TEMPLATES — ver el validator
    // de dealership, comparten fuente.
    templateId: z.enum(TENANT_TEMPLATE_ID_TUPLE).optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "Nada para actualizar",
  });

export type AdminDealershipUpdateInput = z.infer<typeof adminDealershipUpdateSchema>;

// Campos que impactan en lo que ve un visitante del sitio público. Si el PATCH
// toca alguno, hay que invalidar el cache del tenant (TTL de 30 min) o el
// cambio no se ve hasta que expire. Ver el handler PATCH.
export const PUBLIC_SITE_FIELDS = ["siteEnabled", "templateId"] as const;

export function touchesPublicSite(input: AdminDealershipUpdateInput): boolean {
  return PUBLIC_SITE_FIELDS.some((f) => input[f] !== undefined);
}
