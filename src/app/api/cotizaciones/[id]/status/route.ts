import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { quotationStatusUpdateSchema } from "@/lib/validators/quotation";
import { decorateWithExpired } from "@/lib/quotation-status";

type QuotationParams = { id: string };

// Solo se permite avanzar desde "pending" — los estados terminales (accepted,
// rejected) son finales. "expired" no es un estado persistido y por ende no
// es origen de transición: si está expirada, primero hay que extender
// validUntil con PATCH /api/cotizaciones/[id].
//
// PATCH /api/cotizaciones/[id]/status
export const PATCH = withLogger<QuotationParams>(
  async (request, { requestId, params }) => {
    const { userId } = await auth();
    if (!userId) {
      logger.warn(requestId, "quotations.status.unauthorized");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const dealership = await getCurrentDealership();
    if (!dealership) {
      logger.warn(requestId, "quotations.status.no_dealership", { userId });
      return NextResponse.json(
        { error: "Concesionario no encontrado" },
        { status: 404 }
      );
    }

    const { id } = params;
    const body: unknown = await request.json();
    const parsed = quotationStatusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      logger.warn(requestId, "quotations.status.invalid_input", {
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
      select: { id: true, status: true, validUntil: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cotización no encontrada" },
        { status: 404 }
      );
    }

    if (existing.status !== "pending") {
      logger.warn(requestId, "quotations.status.invalid_transition", {
        dealershipId: dealership.id,
        quotationId: id,
        from: existing.status,
        to: parsed.data.status,
      });
      return NextResponse.json(
        {
          error: `No se puede cambiar el estado desde "${existing.status}"`,
        },
        { status: 422 }
      );
    }

    // Bloquear marcar como accepted/rejected si ya está vencida. Para reactivar
    // hay que extender validUntil primero con PATCH /api/cotizaciones/[id].
    if (existing.validUntil < new Date()) {
      logger.warn(requestId, "quotations.status.expired", {
        dealershipId: dealership.id,
        quotationId: id,
      });
      return NextResponse.json(
        {
          error:
            "La cotización está vencida. Extendé la validez antes de cambiar el estado.",
        },
        { status: 409 }
      );
    }

    const updated = await prisma.quotation.update({
      where: { id },
      data: { status: parsed.data.status },
      select: {
        id: true,
        status: true,
        code: true,
        type: true,
        validUntil: true,
      },
    });

    // pending → accepted/rejected baja el count de pendingActive y sube el de
    // accepted (cuando aplica) → invalidamos.
    revalidateTag("quotations-stats");

    logger.info(requestId, "quotations.status.ok", {
      dealershipId: dealership.id,
      quotationId: id,
      from: existing.status,
      to: parsed.data.status,
    });

    return NextResponse.json({ data: decorateWithExpired(updated) });
  }
);
