/**
 * PATCH /api/admin/dealerships/[id]  → super-admin actualiza una cuenta.
 *
 * Cross-tenant: solo super-admin (isSuperAdmin). NO filtra por dealershipId — el
 * super-admin opera sobre cualquier cuenta; el guard es la única protección.
 *
 * PATCH request:  { "plan": "premium" }
 *                 { "subscriptionStatus": "suspended" }
 *                 { "siteEnabled": true }
 *                 { "templateId": "impacto" }
 * PATCH response: { "data": { "id": "cmx...", "slug": "autos-lopez", "plan": "premium",
 *                             "subscriptionStatus": "active", "siteEnabled": true,
 *                             "templateId": "impacto" } }
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { isSuperAdmin } from "@/lib/super-admin";
import { invalidateTenantHomeBundle } from "@/lib/tenant";
import { adminDealershipUpdateSchema, touchesPublicSite } from "@/lib/validators/admin";

type RouteParams = { id: string };

export const PATCH = withLogger<RouteParams>(async (request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId || !isSuperAdmin(userId)) {
    logger.warn(requestId, "admin.dealership.update.forbidden", { userId });
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body: unknown = await request.json();
  const parsed = adminDealershipUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.dealership.update({
      where: { id: params.id },
      data: parsed.data,
      select: {
        id: true,
        slug: true,
        plan: true,
        subscriptionStatus: true,
        siteEnabled: true,
        templateId: true,
      },
    });

    // El dealership y el bundle del home viven en Redis con TTL de 30 min. Sin
    // esto, apagar un sitio o cambiarle la plantilla desde el panel no se vería
    // hasta media hora después — el visitante seguiría viendo el sitio "apagado"
    // igual de vivo que antes. Fail-open: si Redis está caído solo loggea.
    if (touchesPublicSite(parsed.data)) {
      await invalidateTenantHomeBundle(updated.slug);
    }

    logger.info(requestId, "admin.dealership.update.ok", {
      dealershipId: updated.id,
      slug: updated.slug,
      changes: parsed.data,
    });

    return NextResponse.json({ data: updated });
  } catch (error: unknown) {
    // P2025 = registro no encontrado.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }
    throw error;
  }
});
