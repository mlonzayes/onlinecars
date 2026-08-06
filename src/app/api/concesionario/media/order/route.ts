import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { auditFields, resolveSiteBuilderContext } from "@/lib/admin-context";
import { prisma } from "@/lib/prisma";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { mediaOrderSchema } from "@/lib/validators/media";
import { invalidateTenantHomeBundle } from "@/lib/tenant";
import type { MediaPurpose } from "@/lib/constants";

// PUT /api/concesionario/media/order
// Body: { ids: string[] } — ids de gallery_image en el nuevo orden (0-based).
// Solo aplica a la galería (singletons no se reordenan).
// Response 200: { data: { media: TenantHomeBundleMedia[] } }
export const PUT = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "media.order.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ctx = await resolveSiteBuilderContext();
  const dealership = ctx?.dealership;
  if (!ctx || !dealership) {
    logger.warn(requestId, "media.order.no_dealership", { userId });
    return NextResponse.json(
      { error: "Concesionario no encontrado" },
      { status: 404 }
    );
  }

  const body: unknown = await request.json();
  const parsed = mediaOrderSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn(requestId, "media.order.invalid_input", {
      dealershipId: dealership.id,
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { ids } = parsed.data;

  // Verificamos que TODOS los ids pertenezcan a este dealership Y sean
  // gallery_image. Si alguno no matchea, rechazamos completo — detecta tanto
  // IDs ajenos como propósitos inválidos.
  const existing = await prisma.dealershipMedia.findMany({
    where: {
      id: { in: ids },
      dealershipId: dealership.id,
      purpose: "gallery_image",
    },
    select: { id: true },
  });

  if (existing.length !== ids.length) {
    logger.warn(requestId, "media.order.id_mismatch", {
      dealershipId: dealership.id,
      requestCount: ids.length,
      matchedCount: existing.length,
    });
    return NextResponse.json(
      { error: "Algunos elementos no pertenecen a la galería" },
      { status: 400 }
    );
  }

  // Update atómico — index 0-based.
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.dealershipMedia.update({
        where: { id },
        data: { order: index },
      })
    )
  );

  const rows = await prisma.dealershipMedia.findMany({
    where: { dealershipId: dealership.id, purpose: "gallery_image" },
    orderBy: { order: "asc" },
  });

  await invalidateTenantHomeBundle(dealership.slug);

  logger.info(requestId, "media.order.ok", {
    dealershipId: dealership.id,
    count: ids.length,
    ...auditFields(ctx),
  });

  return NextResponse.json({
    data: {
      media: rows.map((m) => ({
        id: m.id,
        purpose: m.purpose as MediaPurpose,
        url: m.url,
        mimeType: m.mimeType,
        order: m.order,
      })),
    },
  });
});
