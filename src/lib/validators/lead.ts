import { z } from "zod";
import { LEAD_SOURCES } from "../constants";

export const leadCreateSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(200),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  message: z.string().max(1000).optional(),
  vehicleId: z.string().cuid().optional(),
  source: z.enum(LEAD_SOURCES).default("web"),
});

export type LeadCreateInput = z.infer<typeof leadCreateSchema>;
