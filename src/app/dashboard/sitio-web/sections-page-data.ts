import { prisma } from "@/lib/prisma";
import { resolveSection } from "@/lib/tenant";
import type {
  TenantHomeBundleMedia,
  TenantHomeBundleSection,
} from "@/lib/tenant";
import { seedDefaultSections } from "@/lib/sections/seed";
import { SECTION_TYPES, type MediaPurpose, type SectionType } from "@/lib/constants";
import type { DealershipTheme } from "@/types";

export type SectionMedia = TenantHomeBundleMedia & { sectionType: SectionType };

export interface SectionsPageData {
  sections: TenantHomeBundleSection[];
  media: SectionMedia[];
}

// Lee directo de DB (no del cache del bundle público) para que el dashboard
// siempre vea la última versión, incluso entre invalidaciones.
export async function getSectionsPageData(
  dealershipId: string,
  legacyTheme: DealershipTheme | null
): Promise<SectionsPageData> {
  // Auto-heal: seedDefaultSections es idempotente y agrega los tipos que falten.
  // Cubre tres casos:
  //   - Dealership nuevo (0 secciones) → siembra las 8 defaults
  //   - Dealership viejo al que se le sumó un tipo nuevo (ej: "categories") →
  //     agrega solo el faltante, sin tocar el resto
  //   - Dealership al día → no-op
  // Esto evita que dependa exclusivamente de la migración SQL que puede no
  // haberse aplicado todavía en el ambiente actual.
  
  // Lazy seed: el count va por fuera de la transacción para evitar timeouts (P2028).
  const existingSectionsCount = await prisma.dealershipSection.count({
    where: { dealershipId },
  });

  if (existingSectionsCount < SECTION_TYPES.length) {
    await prisma.$transaction(
      async (tx) => seedDefaultSections(tx, dealershipId, legacyTheme),
      { timeout: 15_000 }
    );
  }

  const [sectionRows, mediaRows] = await Promise.all([
    prisma.dealershipSection.findMany({
      where: { dealershipId },
      orderBy: { order: "asc" },
    }),
    prisma.dealershipMedia.findMany({
      where: { dealershipId },
      orderBy: { order: "asc" },
    }),
  ]);

  return {
    sections: sectionRows.map(resolveSection),
    media: mediaRows.map((m) => ({
      id: m.id,
      purpose: m.purpose as MediaPurpose,
      url: m.url,
      mimeType: m.mimeType,
      order: m.order,
      sectionType: m.sectionType as SectionType,
    })),
  };
}
