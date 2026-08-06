import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { resolveSiteBuilderContext } from "@/lib/admin-context";
import { prisma } from "@/lib/prisma";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import {
  resolveSection,
  type TenantHomeBundleMedia,
} from "@/lib/tenant";
import { seedDefaultSections } from "@/lib/sections/seed";
import type { DealershipTheme } from "@/types";
import type { MediaPurpose, SectionType } from "@/lib/constants";

// GET /api/concesionario/sections
// Retorna las secciones del dealership autenticado + todos sus medios.
// Si no existen secciones (dealership pre-builder), siembra los defaults
// dentro de una transacción antes de leer.
// Response 200: { data: { sections: TenantHomeBundleSection[], media: TenantHomeBundleMedia[] } }
export const GET = withLogger(async (_request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "sections.list.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Site-builder: puede resolver a otra cuenta si el super-admin está en modo
  // plataforma. Ver src/lib/admin-context.ts.
  const ctx = await resolveSiteBuilderContext();
  const dealership = ctx?.dealership;
  if (!dealership) {
    logger.warn(requestId, "sections.list.no_dealership", { userId });
    return NextResponse.json(
      { error: "Concesionario no encontrado" },
      { status: 404 }
    );
  }

  const theme = dealership.theme as DealershipTheme | null;

  // Lazy seed atómico — idempotente: si ya hay secciones no hace nada.
  const seedResult = await prisma.$transaction(async (tx) => {
    return seedDefaultSections(tx, dealership.id, theme);
  });

  const [sectionRows, mediaRows] = await Promise.all([
    prisma.dealershipSection.findMany({
      where: { dealershipId: dealership.id },
      orderBy: { order: "asc" },
    }),
    prisma.dealershipMedia.findMany({
      where: { dealershipId: dealership.id },
      orderBy: { order: "asc" },
    }),
  ]);

  const sections = sectionRows.map(resolveSection);
  const media: TenantHomeBundleMedia[] = mediaRows.map((m) => ({
    id: m.id,
    purpose: m.purpose as MediaPurpose,
    url: m.url,
    mimeType: m.mimeType,
    order: m.order,
  }));

  logger.info(requestId, "sections.list.ok", {
    dealershipId: dealership.id,
    count: sections.length,
    mediaCount: media.length,
    seeded: seedResult.seeded,
    // El sectionType del media también puede ser útil para clients agrupando — exponemos aparte.
  });

  // Incluimos sectionType en el payload de media para que el cliente pueda
  // agrupar por sección sin requerir una query adicional. Mantenemos la forma
  // base de TenantHomeBundleMedia y agregamos sectionType.
  const mediaWithSection = mediaRows.map((m) => ({
    id: m.id,
    sectionType: m.sectionType as SectionType,
    purpose: m.purpose as MediaPurpose,
    url: m.url,
    mimeType: m.mimeType,
    order: m.order,
  }));

  return NextResponse.json({ data: { sections, media: mediaWithSection } });
});
