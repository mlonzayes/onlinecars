import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { quotationUpdateSchema } from "@/lib/validators/quotation";
import {
  QuotationNotEditableError,
  assertEditable,
  decorateWithExpired,
} from "@/lib/quotation-status";

type QuotationParams = { id: string };

// Detalle completo — incluye relaciones livianas para mostrar en la página.
// El listado usa otro select más compacto.
const DETAIL_INCLUDE = {
  vehicle: {
    select: {
      id: true,
      title: true,
      brand: true,
      model: true,
      year: true,
      kilometers: true,
      color: true,
      transmission: true,
      fuelType: true,
      condition: true,
      images: { where: { isPrimary: true }, take: 1 },
    },
  },
  lead: { select: { id: true, name: true, email: true, phone: true } },
} as const satisfies Prisma.QuotationInclude;

// GET /api/cotizaciones/[id]
export const GET = withLogger<QuotationParams>(
  async (_request, { requestId, params }) => {
    const { userId } = await auth();
    if (!userId) {
      logger.warn(requestId, "quotations.detail.unauthorized");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const dealership = await getCurrentDealership();
    if (!dealership) {
      logger.warn(requestId, "quotations.detail.no_dealership", { userId });
      return NextResponse.json(
        { error: "Concesionario no encontrado" },
        { status: 404 }
      );
    }

    const { id } = params;
    const quotation = await prisma.quotation.findFirst({
      where: { id, dealershipId: dealership.id },
      include: DETAIL_INCLUDE,
    });

    if (!quotation) {
      logger.warn(requestId, "quotations.detail.not_found", {
        dealershipId: dealership.id,
        quotationId: id,
      });
      return NextResponse.json(
        { error: "Cotización no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: decorateWithExpired(quotation) });
  }
);

// PATCH /api/cotizaciones/[id]
// Solo permite actualizar metadata liviana (notes, validUntil). Las transiciones
// de status van por /status. Bloqueado si la cotización ya no es editable
// (accepted/rejected — expired sigue siendo editable porque permite extender validUntil).
export const PATCH = withLogger<QuotationParams>(
  async (request, { requestId, params }) => {
    const { userId } = await auth();
    if (!userId) {
      logger.warn(requestId, "quotations.update.unauthorized");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const dealership = await getCurrentDealership();
    if (!dealership) {
      logger.warn(requestId, "quotations.update.no_dealership", { userId });
      return NextResponse.json(
        { error: "Concesionario no encontrado" },
        { status: 404 }
      );
    }

    const { id } = params;
    const body: unknown = await request.json();
    const parsed = quotationUpdateSchema.safeParse(body);

    if (!parsed.success) {
      logger.warn(requestId, "quotations.update.invalid_input", {
        dealershipId: dealership.id,
        quotationId: id,
        details: parsed.error.flatten(),
      });
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.quotation.findFirst({
      where: { id, dealershipId: dealership.id },
      select: { id: true, status: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cotización no encontrada" },
        { status: 404 }
      );
    }

    try {
      assertEditable(existing);
    } catch (error) {
      if (error instanceof QuotationNotEditableError) {
        logger.warn(requestId, "quotations.update.not_editable", {
          dealershipId: dealership.id,
          quotationId: id,
          status: error.currentStatus,
        });
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      throw error;
    }

    const updateData: Prisma.QuotationUpdateInput = {};
    if (parsed.data.notes !== undefined) {
      updateData.notes = parsed.data.notes;
    }
    if (parsed.data.validUntil !== undefined) {
      updateData.validUntil = new Date(parsed.data.validUntil);
    }

    const quotation = await prisma.quotation.update({
      where: { id },
      data: updateData,
      include: DETAIL_INCLUDE,
    });

    // Extender validUntil puede mover una cotización de "expired efectivo" a
    // "pending activa" → afecta el count pendingActive del cache.
    revalidateTag("quotations-stats");

    logger.info(requestId, "quotations.update.ok", {
      dealershipId: dealership.id,
      quotationId: id,
    });

    return NextResponse.json({ data: decorateWithExpired(quotation) });
  }
);

// DELETE /api/cotizaciones/[id]
// Permitido para `pending` (incluso si efectivamente está expirada) y para
// `rejected`. `accepted` queda como histórico de operaciones cerradas y no
// se puede borrar.
export const DELETE = withLogger<QuotationParams>(
  async (_request, { requestId, params }) => {
    const { userId } = await auth();
    if (!userId) {
      logger.warn(requestId, "quotations.delete.unauthorized");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const dealership = await getCurrentDealership();
    if (!dealership) {
      logger.warn(requestId, "quotations.delete.no_dealership", { userId });
      return NextResponse.json(
        { error: "Concesionario no encontrado" },
        { status: 404 }
      );
    }

    const { id } = params;
    const existing = await prisma.quotation.findFirst({
      where: { id, dealershipId: dealership.id },
      select: { id: true, status: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cotización no encontrada" },
        { status: 404 }
      );
    }

    if (existing.status !== "pending" && existing.status !== "rejected") {
      logger.warn(requestId, "quotations.delete.invalid_status", {
        dealershipId: dealership.id,
        quotationId: id,
        status: existing.status,
      });
      return NextResponse.json(
        {
          error:
            "Solo se pueden eliminar cotizaciones pendientes o rechazadas",
        },
        { status: 409 }
      );
    }

    await prisma.quotation.delete({ where: { id } });

    revalidateTag("quotations-stats");

    logger.info(requestId, "quotations.delete.ok", {
      dealershipId: dealership.id,
      quotationId: id,
    });

    return NextResponse.json({ data: { id } });
  }
);
