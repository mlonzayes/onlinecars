import { z } from "zod";

// Body de POST /api/vehiculos/[id]/ml/destacar. "silver" quita el destaque y
// libera el lugar del paquete de destaques.
export const mlListingTypeUpdateSchema = z.object({
  listingTypeId: z.enum(["silver", "gold", "gold_premium"]),
});

export type MLListingTypeUpdateInput = z.infer<typeof mlListingTypeUpdateSchema>;
