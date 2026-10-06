import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { QuotationStatus } from "@/lib/constants";
import { assertAccountActive, logMeta, type ServiceContext } from "../context";
import { pageArgs, pageMeta } from "../pagination";

// Sin documentos de la contraparte (saleClientDocument / purchaseSellerDocument):
// mismo criterio que ventas.
const QUOTATION_SELECT = {
  id: true,
  code: true,
  type: true,
  status: true,
  currency: true,
  validUntil: true,
  emittedAt: true,
  notes: true,
  saleClientName: true,
  saleClientPhone: true,
  saleTotalPrice: true,
  salePaymentMethod: true,
  purchaseSellerName: true,
  purchaseSellerPhone: true,
  purchaseBrand: true,
  purchaseModel: true,
  purchaseYear: true,
  purchaseOfferAmount: true,
  vehicle: { select: { id: true, title: true, year: true } },
} satisfies Prisma.QuotationSelect;

export type QuotationRow = Prisma.QuotationGetPayload<{ select: typeof QUOTATION_SELECT }>;

export interface ListQuotationsParams {
  page: number;
  status?: QuotationStatus;
  type?: "sale" | "purchase";
}

export async function listQuotations(ctx: ServiceContext, params: ListQuotationsParams) {
  assertAccountActive(ctx, "quotations.list");

  const where: Prisma.QuotationWhereInput = {
    dealershipId: ctx.dealership.id,
    ...(params.status ? { status: params.status } : {}),
    ...(params.type ? { type: params.type } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.quotation.count({ where }),
    prisma.quotation.findMany({
      where,
      select: QUOTATION_SELECT,
      orderBy: { emittedAt: "desc" },
      ...pageArgs(params.page),
    }),
  ]);

  logger.info(ctx.requestId, "quotations.list.ok", logMeta(ctx, { total }));
  return { items, ...pageMeta(total, params.page) };
}
