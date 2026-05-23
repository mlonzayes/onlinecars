import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import {
  quotationCreateSchema,
  quotationListQuerySchema,
} from "@/lib/validators/quotation";
import { nextQuotationNumber } from "@/lib/quotation-numbering";
import {
  decorateWithExpired,
  effectiveStatusFilter,
} from "@/lib/quotation-status";

// Campos mínimos para las cards/tabla del listado — no traemos los snapshots
// completos de cliente/vehículo, solo lo justo para mostrar y filtrar.
const LIST_SELECT = {
  id: true,
  type: true,
  code: true,
  status: true,
  currency: true,
  validUntil: true,
  emittedAt: true,
  createdAt: true,
  // Snapshot mínimo de contraparte
  saleClientName: true,
  saleTotalPrice: true,
  purchaseSellerName: true,
  purchaseOfferAmount: true,
  // Relaciones livianas para la UI
  vehicle: {
    select: { id: true, title: true, brand: true, model: true, year: true },
  },
  lead: { select: { id: true, name: true } },
} satisfies Prisma.QuotationSelect;

// GET /api/cotizaciones
// Lista paginada de cotizaciones. Soporta filtros por type y status — el
// `status=expired` se traduce a un WHERE compuesto porque `expired` no vive
// en DB (ver effectiveStatusFilter).
export const GET = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "quotations.list.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "quotations.list.no_dealership", { userId });
    return NextResponse.json(
      { error: "Concesionario no encontrado" },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsedQuery = quotationListQuerySchema.safeParse(
    Object.fromEntries(searchParams.entries())
  );

  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: "Parámetros inválidos",
        details: parsedQuery.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { type, status, page, limit } = parsedQuery.data;

  const where: Prisma.QuotationWhereInput = {
    dealershipId: dealership.id,
    ...(type ? { type } : {}),
    ...effectiveStatusFilter(status),
  };

  const [total, rows] = await Promise.all([
    prisma.quotation.count({ where }),
    prisma.quotation.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: LIST_SELECT,
    }),
  ]);

  const data = rows.map(decorateWithExpired);

  logger.info(requestId, "quotations.list.ok", {
    dealershipId: dealership.id,
    total,
    page,
    limit,
    type,
    status,
  });

  return NextResponse.json({
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

// POST /api/cotizaciones
// Crea una cotización (sale o purchase). El número correlativo se reserva
// dentro de una transacción vía nextQuotationNumber — sin eso podríamos
// asignar el mismo número a dos cotizaciones concurrentes.
export const POST = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "quotations.create.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "quotations.create.no_dealership", { userId });
    return NextResponse.json(
      { error: "Concesionario no encontrado" },
      { status: 404 }
    );
  }

  const body: unknown = await request.json();
  const parsed = quotationCreateSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn(requestId, "quotations.create.invalid_input", {
      dealershipId: dealership.id,
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const validUntil = new Date(
    Date.now() + input.validityDays * 24 * 60 * 60 * 1000
  );

  // Validaciones de pertenencia al dealer ANTES de la transacción para no
  // gastar un número del counter por nada.
  if (input.type === "sale") {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: input.vehicleId, dealershipId: dealership.id },
      select: { id: true },
    });
    if (!vehicle) {
      logger.warn(requestId, "quotations.create.vehicle_not_found", {
        dealershipId: dealership.id,
        vehicleId: input.vehicleId,
      });
      return NextResponse.json(
        { error: "Vehículo no encontrado" },
        { status: 404 }
      );
    }
  } else if (input.leadId) {
    const lead = await prisma.lead.findFirst({
      where: { id: input.leadId, dealershipId: dealership.id },
      select: { id: true },
    });
    if (!lead) {
      logger.warn(requestId, "quotations.create.lead_not_found", {
        dealershipId: dealership.id,
        leadId: input.leadId,
      });
      return NextResponse.json(
        { error: "Lead no encontrado" },
        { status: 404 }
      );
    }
  }

  const quotation = await prisma.$transaction(async (tx) => {
    const { number, code } = await nextQuotationNumber(
      tx,
      dealership.id,
      input.type
    );

    const baseData = {
      dealershipId: dealership.id,
      type: input.type,
      number,
      code,
      currency: input.currency,
      validUntil,
      notes: input.notes ?? null,
      createdByClerkUserId: userId,
    };

    if (input.type === "sale") {
      return tx.quotation.create({
        data: {
          ...baseData,
          vehicleId: input.vehicleId,
          saleClientName: input.client.name,
          saleClientDocument: input.client.document ?? null,
          saleClientEmail: input.client.email || null,
          saleClientPhone: input.client.phone ?? null,
          saleTotalPrice: input.totalPrice,
          saleDownPayment: input.downPayment ?? null,
          saleInstallments: input.installments ?? null,
          saleInstallmentAmount: input.installmentAmount ?? null,
          salePaymentMethod: input.paymentMethod,
          saleSellerName: input.sellerName ?? null,
          saleTradeInBrand: input.tradeIn?.brand ?? null,
          saleTradeInModel: input.tradeIn?.model ?? null,
          saleTradeInYear: input.tradeIn?.year ?? null,
          saleTradeInValue: input.tradeIn?.value ?? null,
          saleTradeInCurrency: input.tradeIn?.currency ?? null,
        },
        select: LIST_SELECT,
      });
    }

    return tx.quotation.create({
      data: {
        ...baseData,
        leadId: input.leadId ?? null,
        purchaseSellerName: input.seller.name,
        purchaseSellerDocument: input.seller.document ?? null,
        purchaseSellerEmail: input.seller.email || null,
        purchaseSellerPhone: input.seller.phone ?? null,
        purchaseBrand: input.vehicle.brand,
        purchaseModel: input.vehicle.model,
        purchaseYear: input.vehicle.year,
        purchaseVersion: input.vehicle.version ?? null,
        purchaseKilometers: input.vehicle.kilometers ?? null,
        purchaseColor: input.vehicle.color ?? null,
        purchaseFuelType: input.vehicle.fuelType ?? null,
        purchaseTransmission: input.vehicle.transmission ?? null,
        purchaseCondition: input.vehicle.condition ?? null,
        purchaseOfferAmount: input.offerAmount,
        purchasePaymentMethod: input.paymentMethod,
      },
      select: LIST_SELECT,
    });
  });

  revalidateTag("quotations-stats");

  logger.info(requestId, "quotations.create.ok", {
    dealershipId: dealership.id,
    quotationId: quotation.id,
    type: quotation.type,
    code: quotation.code,
  });

  return NextResponse.json(
    { data: decorateWithExpired(quotation) },
    { status: 201 }
  );
});
