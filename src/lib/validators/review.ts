import { z } from "zod";

// Schema del POST público de reviews. Aplica desde el sitio del tenant
// ({slug}.onlinecars.com.ar) — input no confiable, todo con límites duros.
export const reviewCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre es requerido")
    .max(80, "Máximo 80 caracteres"),
  content: z
    .string()
    .trim()
    .min(10, "Contanos un poco más, mínimo 10 caracteres")
    .max(1000, "Máximo 1000 caracteres"),
  rating: z
    .number()
    .int("El rating debe ser un número entero")
    .min(1, "El rating mínimo es 1")
    .max(5, "El rating máximo es 5"),
});

export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
