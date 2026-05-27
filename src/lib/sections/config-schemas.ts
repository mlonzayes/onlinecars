import { z } from "zod";
import type { SectionType } from "../constants";

// Schemas Zod por tipo de sección. Cada uno valida el shape de DealershipSection.config
// para su `type`. `sectionConfigSchemaFor(type)` devuelve el schema correcto.

export const heroConfigSchema = z.object({
  overlay: z.number().int().min(0).max(100),
  align: z.enum(["left", "center"]),
  showSearch: z.boolean(),
  // Default false: hero configs creados antes de esta feature siguen funcionando
  // sin migración. Solo aparece el toggle si el dealer lo activa explícitamente.
  showQuickActions: z.boolean().default(false),
}).strict();

// Categorías: schema vacío. Si en el futuro hay config (ej: bodyTypes ocultos),
// se agrega acá y todo el resto del sistema lo agarra solo.
export const categoriesConfigSchema = z.object({}).strict();

// Marcas: schema vacío. Las marcas seleccionadas viven en theme.selectedBrandIds
// (no en el config de la sección) — esta sección solo controla orden, enabled
// y copy. La selección se edita desde un panel dedicado en el editor.
export const brandsConfigSchema = z.object({}).strict();

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
  categories: categoriesConfigSchema,
  about: aboutConfigSchema,
  catalog: catalogConfigSchema,
  brands: brandsConfigSchema,
  gallery: galleryConfigSchema,
  financing: financingConfigSchema,
  reviews: reviewsConfigSchema,
  contact: contactConfigSchema,
} as const;

export function sectionConfigSchemaFor<T extends SectionType>(type: T) {
  return schemaMap[type];
}
