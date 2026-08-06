import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { auditFields, resolveSiteBuilderContext } from "@/lib/admin-context";
import { prisma } from "@/lib/prisma";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { sectionOrderSchema } from "@/lib/validators/section";
import { invalidateTenantHomeBundle, resolveSection } from "@/lib/tenant";

// PUT /api/concesionario/sections/order
// Body: { order: SectionType[] } — listado COMPLETO de las 7 secciones en el nuevo orden.
// El orden persistido es 1-based (consistente con DEFAULT_SECTION_ORDER del seed).
// Response 200: { data: { sections: TenantHomeBundleSection[] } }
export const PUT = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "sections.order.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ctx = await resolveSiteBuilderContext();
  const dealership = ctx?.dealership;
  if (!ctx || !dealership) {
    logger.warn(requestId, "sections.order.no_dealership", { userId });
    return NextResponse.json(
      { error: "Concesionario no encontrado" },
      { status: 404 }
    );
  }

  const body: unknown = await request.json();
  const parsed = sectionOrderSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn(requestId, "sections.order.invalid_input", {
      dealershipId: dealership.id,
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Update atómico de las 7 filas dentro de una transacción.
  // El orden persistido es index + 1 — alineado con DEFAULT_SECTION_ORDER (1-based).
  await prisma.$transaction(
    parsed.data.order.map((type, index) =>
      prisma.dealershipSection.update({
        where: { dealershipId_type: { dealershipId: dealership.id, type } },
        data: { order: index + 1 },
      })
    )
  );

  const rows = await prisma.dealershipSection.findMany({
    where: { dealershipId: dealership.id },
    orderBy: { order: "asc" },
  });

  await invalidateTenantHomeBundle(dealership.slug);

  logger.info(requestId, "sections.order.ok", {
    dealershipId: dealership.id,
    order: parsed.data.order,
    ...auditFields(ctx),
  });

  return NextResponse.json({
    data: { sections: rows.map(resolveSection) },
  });
});
