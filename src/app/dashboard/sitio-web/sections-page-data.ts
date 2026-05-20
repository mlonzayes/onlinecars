import { prisma } from "@/lib/prisma";
import { resolveSection } from "@/lib/tenant";
import type {
  TenantHomeBundleMedia,
  TenantHomeBundleSection,
} from "@/lib/tenant";
import { seedDefaultSections } from "@/lib/sections/seed";
import type { MediaPurpose, SectionType } from "@/lib/constants";
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
  // Lazy seed por las dudas — para dealers que aún no abrieron su sitio público.
  // Solo abrimos transacción si realmente hay que sembrar; el count fuera de tx
  // evita el P2028 (Transaction not found) en cold starts de Neon.
  const existingSections = await prisma.dealershipSection.count({
    where: { dealershipId },
  });
  if (existingSections === 0) {
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
