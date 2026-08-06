import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { auditFields, resolveSiteBuilderContext } from "@/lib/admin-context";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { invalidateTenantHomeBundle } from "@/lib/tenant";

type RouteParams = { id: string };

// DELETE /api/concesionario/media/[id]
// Borra el row de DB y best-effort el archivo en storage.
// Response 200: { data: { id } }
export const DELETE = withLogger<RouteParams>(async (_request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "media.delete.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ctx = await resolveSiteBuilderContext();
  const dealership = ctx?.dealership;
  if (!ctx || !dealership) {
    logger.warn(requestId, "media.delete.no_dealership", { userId });
    return NextResponse.json(
      { error: "Concesionario no encontrado" },
      { status: 404 }
    );
  }

  const { id: mediaId } = params;

  // Ownership check vía filtro por dealershipId — multi-tenancy no-negociable.
  const media = await prisma.dealershipMedia.findFirst({
    where: { id: mediaId, dealershipId: dealership.id },
  });

  if (!media) {
    logger.warn(requestId, "media.delete.not_found", {
      dealershipId: dealership.id,
      mediaId,
    });
    return NextResponse.json(
      { error: "Media no encontrado" },
      { status: 404 }
    );
  }

  // Borramos el DB row primero. Si falla, no tocamos storage.
  await prisma.dealershipMedia.delete({ where: { id: media.id } });

  // Best-effort delete del archivo. Las keys legacy: nunca pasaron por storage
  // y van a fallar — está OK, lo loggeamos como warn.
  try {
    await storage.delete(media.key, "public");
  } catch (error) {
    logger.warn(requestId, "media.delete.storage_failed", {
      dealershipId: dealership.id,
      mediaId,
      key: media.key,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  await invalidateTenantHomeBundle(dealership.slug);

  logger.info(requestId, "media.delete.ok", {
    dealershipId: dealership.id,
    mediaId,
    purpose: media.purpose,
    ...auditFields(ctx),
  });

  return NextResponse.json({ data: { id: mediaId } });
});
