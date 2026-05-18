import { z } from "zod";
import type { SectionType } from "../constants";

// Schemas Zod por tipo de sección. Cada uno valida el shape de DealershipSection.config
// para su `type`. `sectionConfigSchemaFor(type)` devuelve el schema correcto.

export const heroConfigSchema = z.object({
  overlay: z.number().int().min(0).max(100),
  align: z.enum(["left", "center"]),
  showSearch: z.boolean(),
}).strict();

export const aboutConfigSchema = z.object({
  layout: z.enum(["text-only", "image-left", "image-right"]),
}).strict();

export const catalogConfigSchema = z.object({
  showFilters: z.boolean(),
  pageSize: z.number().int().min(6).max(18),
  emphasis: z.enum(["featured", "recent"]),
}).strict();

export const galleryConfigSchema = z.object({
  layout: z.enum(["grid", "masonry"]),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
}).strict();

export const financingConfigSchema = z.object({
  showCalculatorCta: z.boolean(),
}).strict();

export const reviewsConfigSchema = z.object({
  showCta: z.boolean(),
  maxItems: z.number().int().min(3).max(12),
}).strict();

export const contactConfigSchema = z.object({
  showMap: z.boolean(),
  showWhatsapp: z.boolean(),
}).strict();

const schemaMap = {
  hero: heroConfigSchema,
  about: aboutConfigSchema,
  catalog: catalogConfigSchema,
  gallery: galleryConfigSchema,
  financing: financingConfigSchema,
  reviews: reviewsConfigSchema,
  contact: contactConfigSchema,
} as const;

export function sectionConfigSchemaFor<T extends SectionType>(type: T) {
  return schemaMap[type];
}
