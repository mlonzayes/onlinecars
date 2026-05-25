import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dealershipUpdateSchema } from "@/lib/validators/dealership";
import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { invalidateTenantHomeBundle } from "@/lib/tenant";

// GET /api/concesionario
// Retorna los datos del concesionario del usuario autenticado.
// Response 200: { data: Dealership }
export const GET = withLogger(async (_request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "dealership.get.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "dealership.get.not_found", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  logger.info(requestId, "dealership.get.ok", { dealershipId: dealership.id });
  return NextResponse.json({ data: dealership });
});

// PUT /api/concesionario
// Actualiza los datos del concesionario. No permite cambiar el slug.
// Body: DealershipUpdateInput
// Response 200: { data: Dealership }
export const PUT = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "dealership.update.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "dealership.update.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const body: unknown = await request.json();
  const parsed = dealershipUpdateSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn(requestId, "dealership.update.invalid_input", {
      dealershipId: dealership.id,
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Solo admins pueden cambiar el toggle de visibilidad de costos.
  // Si lo mandó un user no-admin, descartamos el campo en silencio.
  const updateData = { ...parsed.data };
  if (dealership.currentUser.role !== "admin") {
    delete updateData.showCostsToNonAdmins;
  }

  const updated = await prisma.dealership.update({
    where: { id: dealership.id },
    data: updateData,
  });

  // Invalidamos con el slug NUEVO y el viejo — por las dudas que se haya
  // cambiado el slug en este update (aunque hoy el schema no lo permita).
  await invalidateTenantHomeBundle(updated.slug);
  if (updated.slug !== dealership.slug) {
    await invalidateTenantHomeBundle(dealership.slug);
  }

  logger.info(requestId, "dealership.update.ok", { dealershipId: updated.id });
  return NextResponse.json({ data: updated });
});
