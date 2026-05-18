import { z } from "zod";
import { SECTION_TYPES, SECTION_TEXT_LIMITS } from "../constants";

// Validadores para el endpoint de actualización de secciones del sitio público.
// El PATCH es parcial — todos los campos opcionales. Las strings nullable permiten
// limpiar el contenido enviando null explícito.

const titleSchema = z.string().trim().min(SECTION_TEXT_LIMITS.titleMin).max(SECTION_TEXT_LIMITS.titleMax);
const subtitleSchema = z.string().trim().max(SECTION_TEXT_LIMITS.subtitleMax);
const contentSchema = z.string().trim().max(SECTION_TEXT_LIMITS.contentMax);

export const sectionPatchSchema = z.object({
  enabled: z.boolean().optional(),
  title: titleSchema.nullable().optional(),
  subtitle: subtitleSchema.nullable().optional(),
  content: contentSchema.nullable().optional(),
  config: z.record(z.string(), z.unknown()).nullable().optional(),
}).strict();

export type SectionPatchInput = z.infer<typeof sectionPatchSchema>;

export const sectionTypeSchema = z.enum(SECTION_TYPES);

// El reorder recibe la lista completa de tipos en el nuevo orden.
// Refine asegura que no haya duplicados ni faltantes — un PUT atómico.
export const sectionOrderSchema = z.object({
  order: z.array(sectionTypeSchema).length(SECTION_TYPES.length),
}).strict().refine(
  (data) => new Set(data.order).size === SECTION_TYPES.length,
  { message: "Todos los tipos de sección deben aparecer exactamente una vez" }
);

export type SectionOrderInput = z.infer<typeof sectionOrderSchema>;
