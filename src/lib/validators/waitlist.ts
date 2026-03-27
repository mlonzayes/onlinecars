import { z } from "zod";

export const waitlistSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(200).optional(),
  dealership: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
