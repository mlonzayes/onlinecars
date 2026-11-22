import { z } from "zod";
import { POST_AUTHOR_TYPES, POST_CATEGORIES, POST_STATUSES } from "@/data/post-types";

/**
 * Validación de una nota del blog. La usan el editor del admin (antes de
 * mandar) y los endpoints /api/admin/blog (antes de tocar la DB).
 */

// Marcador que deja el borrador de la IA donde haría falta un dato real.
// Una nota con marcadores no se puede publicar: es la barrera contra cifras inventadas.
export const DATA_PLACEHOLDER = "[DATO";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// "YYYY-MM-DDTHH:mm" de un <input type="datetime-local">, en hora argentina.
const LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const trimmed = (min: number, max: number, label: string) =>
  z.string().trim().min(min, `${label}: mínimo ${min} caracteres`).max(max, `${label}: máximo ${max} caracteres`);

const httpsUrl = z.url({ protocol: /^https$/, error: "Tiene que ser una URL https://" });

export const blogPostSchema = z
  .object({
    title: trimmed(10, 110, "Título"),
    slug: z.string().trim().max(100).regex(SLUG, "URL: solo minúsculas, números y guiones"),
    excerpt: trimmed(30, 300, "Bajada"),
    category: z.enum(POST_CATEGORIES),
    body: trimmed(200, 60000, "Cuerpo"),
    tldr: z.array(trimmed(10, 400, "Resumen")).max(5, "Resumen: hasta 5 puntos"),
    faqs: z
      .array(z.object({ question: trimmed(5, 200, "Pregunta"), answer: trimmed(5, 800, "Respuesta") }))
      .max(10, "Hasta 10 preguntas"),
    sources: z.array(z.object({ label: trimmed(2, 200, "Fuente"), url: httpsUrl })).max(10, "Hasta 10 fuentes"),
    // Ruta de /public ("/premium_images/x.png") o URL del bucket público.
    coverImage: z
      .string()
      .trim()
      .max(500)
      .refine((v) => (v.startsWith("/") && !v.startsWith("//")) || v.startsWith("https://"), "Portada inválida")
      .nullable(),
    authorName: trimmed(2, 80, "Autor"),
    authorInitials: z.string().trim().min(1).max(3, "Iniciales: hasta 3 letras"),
    authorType: z.enum(POST_AUTHOR_TYPES),
    authorUrl: httpsUrl.nullable(),
    status: z.enum(POST_STATUSES),
    publishAt: z.string().regex(LOCAL_DATETIME, "Fecha de salida inválida").nullable(),
    contentUpdatedOn: z.string().regex(DATE, "Fecha inválida").nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.status !== "published") return;
    if (!v.publishAt) {
      ctx.addIssue({ code: "custom", path: ["publishAt"], message: "Elegí la fecha de salida" });
    }
    const texts = [v.title, v.excerpt, v.body, ...v.tldr, ...v.faqs.flatMap((f) => [f.question, f.answer])];
    if (texts.some((t) => t.includes(DATA_PLACEHOLDER))) {
      ctx.addIssue({
        code: "custom",
        path: ["body"],
        message: "Completá o borrá los [DATO: …] antes de publicar",
      });
    }
  });

export type BlogPostFormValues = z.infer<typeof blogPostSchema>;

/** Hora argentina fija (-03:00, sin horario de verano) → Date. */
export function arLocalToDate(value: string): Date {
  return new Date(`${value}:00-03:00`);
}

/** Lo que se le pide a la IA para armar un borrador. */
export const blogDraftRequestSchema = z.object({
  topic: trimmed(5, 300, "Tema"),
  notes: z.string().trim().max(3000).optional(),
});
