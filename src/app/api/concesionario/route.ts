import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { dealershipUpdateSchema } from "@/lib/validators/dealership";
import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { invalidateTenantHomeBundle } from "@/lib/tenant";
import { getPlanLimits } from "@/lib/plans";
import { addDomainToVercel, removeDomainFromVercel } from "@/lib/vercel";

// Feature flag: dominios custom en STANDBY (Fase 2). Mientras esté en false:
//   - El campo `website` se ignora silenciosamente en el PUT (no se guarda)
//   - No se llama a la API de Vercel
//   - La UI muestra "Próximamente"
// Para reactivar en Fase 2: poner en true + terminar el routing en el middleware
// (getDealershipByDomain + rewrite). Ver website-settings.tsx para la UI.
const CUSTOM_DOMAINS_ENABLED = false;

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

  // FAB de WhatsApp: si el plan no lo permite, FORZAMOS enabled=false aunque
  // el cliente lo haya mandado en true. El admin del cliente intentando "activar"
  // sin el plan correcto NO lo logra desde acá. El mensaje custom se permite
  // siempre (es solo texto, no representa ventaja sin el FAB visible).
  const limits = getPlanLimits(dealership);
  if (!limits.allowWhatsappFab && updateData.whatsappFabEnabled === true) {
    updateData.whatsappFabEnabled = false;
  }

  // Dominios custom en STANDBY (Fase 2). Mientras CUSTOM_DOMAINS_ENABLED sea
  // false: ignoramos el campo website por completo — no se guarda ni se toca
  // Vercel. La UI lo muestra como "Próximamente".
  if (!CUSTOM_DOMAINS_ENABLED) {
    delete updateData.website;
  } else if ("website" in updateData && updateData.website !== dealership.website) {
    // Sincronización con Vercel — BEST-EFFORT, nunca bloquea el guardado en DB.
    // La DB es la fuente de verdad. Si Vercel falla, lo logueamos pero guardamos.
    // NOTA: el routing del dominio custom todavía no está en el middleware —
    // registrar en Vercel solo no alcanza para servir el tenant. Trabajo aparte.
    const oldDomain = dealership.website;
    const newDomain = updateData.website;

    if (oldDomain) {
      await removeDomainFromVercel(oldDomain).catch(() => {});
    }
    if (newDomain) {
      const result = await addDomainToVercel(newDomain);
      if (!result.success) {
        if (result.error === "missing_env") {
          logger.warn(requestId, "dealership.update.vercel_skipped", { domain: newDomain, reason: "missing_env" });
        } else {
          logger.error(requestId, "dealership.update.vercel_sync_failed", { domain: newDomain, error: result.error });
        }
      }
    }
  }

  // Gotcha Prisma: una columna Json? NO acepta `null` literal en update — hay que
  // pasar Prisma.DbNull para escribir SQL NULL. Solo aplica si el cliente mandó
  // socialLinks explícitamente en null (limpió todas las redes). Se arma acá, al
  // final, para que herede el delete de `website` de arriba.
  const prismaData: Record<string, unknown> = { ...updateData };
  if (updateData.socialLinks === null) {
    prismaData.socialLinks = Prisma.DbNull;
  }

  try {
    const updated = await prisma.dealership.update({
      where: { id: dealership.id },
      data: prismaData,
    });

    // Invalidamos con el slug NUEVO y el viejo
    await invalidateTenantHomeBundle(updated.slug);
    if (updated.slug !== dealership.slug) {
      await invalidateTenantHomeBundle(dealership.slug);
    }

    logger.info(requestId, "dealership.update.ok", { dealershipId: updated.id });
    return NextResponse.json({ data: updated });
  } catch (error: unknown) {
    // P2002 = unique constraint violation. Si el target incluye "website",
    // sabemos que otro dealer ya registró ese dominio.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      Array.isArray(error.meta?.target) &&
      (error.meta.target as string[]).includes("website")
    ) {
      logger.warn(requestId, "dealership.update.website_conflict", { website: updateData.website });
      // Si dio error en BD y ya habíamos registrado en Vercel el nuevo, habría que hacer rollback en Vercel
      // Para simplificar, lo sacamos de Vercel (best-effort)
      if (updateData.website && updateData.website !== dealership.website) {
        await removeDomainFromVercel(updateData.website as string).catch(() => {});
      }
      return NextResponse.json({ error: "El dominio ya está registrado por otra concesionaria." }, { status: 409 });
    }
    throw error;
  }
});
