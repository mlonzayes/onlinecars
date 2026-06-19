import { z } from "zod";
import { DEALERSHIP_PLANS } from "@/lib/constants";

// Acciones del super-admin sobre una cuenta (dealership). Solo plan y el toggle
// de habilitado/suspendido — el resto de los campos del dealership se editan
// desde el panel del propio tenant, no desde acá.
export const adminDealershipUpdateSchema = z
  .object({
    plan: z.enum(DEALERSHIP_PLANS).optional(),
    // El super-admin solo habilita (active) o deshabilita (suspended) una cuenta.
    subscriptionStatus: z.enum(["active", "suspended"]).optional(),
  })
  .refine((d) => d.plan !== undefined || d.subscriptionStatus !== undefined, {
    message: "Nada para actualizar",
  });

export type AdminDealershipUpdateInput = z.infer<typeof adminDealershipUpdateSchema>;
