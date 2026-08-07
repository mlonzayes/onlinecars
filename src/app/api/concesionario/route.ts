import { auth } from "@clerk/nextjs/server";
import { auditFields, resolveSiteBuilderContext } from "@/lib/admin-context";
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

// Campos que el super-admin PUEDE tocar cuando está en modo plataforma (armando
// el sitio de un cliente). El alcance acordado es DISEÑO DEL SITIO: nada de la
// operatoria ni de la config comercial del cliente (usdSpread, currency,
// showCostsToNonAdmins, datos de contacto, etc).
//
// Es defensa server-side: la UI del editor no expone esos campos, pero el
// endpoint es el mismo que usa el dealer y sin esto aceptaría cualquiera del
// schema. Rechazamos con 403 en vez de strippear en silencio — si el editor
// algún día manda un campo nuevo, queremos enterarnos, no que falle mudo.
const PLATFORM_EDITABLE_FIELDS = new Set([
  // Publicación y apariencia
  "siteEnabled",
  "templateId",
  "announcement",
  "logo",
  // Identidad y textos que salen en el sitio (header, footer, SEO, sección
  // "nosotros"). El ContactForm dice literal "Estos datos aparecen en tu sitio
  // público" — son contenido, no configuración comercial.
  "name",
  "description",
  // Contacto: se renderiza en la sección Contacto, el footer y el FAB
  "phone",
  "email",
  "whatsapp",
  "whatsappFabEnabled",
  "whatsappMessage",
  // Ubicación y mapa del sitio
  "address",
  "showAddress",
  "city",
  "province",
  "latitude",
  "longitude",
  "mapLabel",
  // Redes del footer
  "socialLinks",
]);

// Deliberadamente AFUERA (y que siga así): usdSpread, currency, locale,
// siteLocale, timezone, country, showCostsToNonAdmins y website. Son la
// operatoria y la configuración comercial del cliente, no el diseño de su web.
// El alcance del modo plataforma es el sitio; si mañana hace falta tocar algo
// de esta lista, es una decisión de producto, no un ajuste de whitelist.

// GET /api/concesionario
// Retorna los datos del concesionario del usuario autenticado.
// Response 200: { data: Dealership }
export const GET = withLogger(async (_request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "dealership.get.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ctx = await resolveSiteBuilderContext();
  const dealership = ctx?.dealership;
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

  const ctx = await resolveSiteBuilderContext();
  const dealership = ctx?.dealership;
  if (!ctx || !dealership) {
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

  // Modo plataforma: el super-admin solo puede tocar campos de diseño del sitio.
  if (ctx.actingAsPlatform) {
    const forbidden = Object.keys(parsed.data).filter(
      (k) => !PLATFORM_EDITABLE_FIELDS.has(k)
    );
    if (forbidden.length > 0) {
      logger.warn(requestId, "dealership.update.platform_field_denied", {
        dealershipId: dealership.id,
        forbidden,
        ...auditFields(ctx),
      });
      return NextResponse.json(
        { error: "En modo plataforma solo se pueden editar campos del sitio web" },
        { status: 403 }
      );
    }
  }

  // Solo admins pueden cambiar config sensible de precios (visibilidad de costos
  // y el spread de la cotización). Si lo mandó un user no-admin, descartamos
  // esos campos en silencio.
  const updateData = { ...parsed.data };
  if (dealership.currentUser.role !== "admin") {
    delete updateData.showCostsToNonAdmins;
    delete updateData.usdSpread;
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

    logger.info(requestId, "dealership.update.ok", {
      dealershipId: updated.id,
      ...auditFields(ctx),
    });
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
