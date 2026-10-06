import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { SaleStatus } from "@/lib/constants";
import { assertAccountActive, logMeta, type ServiceContext } from "../context";
import { ServiceError } from "../service-error";
import { pageArgs, pageMeta } from "../pagination";

// Lectura de ventas para canales como el MCP. Del cliente sale nombre y
// contacto, NUNCA el número de documento ni el legajo: es el dato más sensible
// del sistema y no tiene que viajar a un proveedor de IA.

const SALE_SELECT = {
  id: true,
  status: true,
  salePrice: true,
  currency: true,
  depositAmount: true,
  depositDate: true,
  invoiceNumber: true,
  invoiceDate: true,
  deliveryDate: true,
  cancelReason: true,
  notes: true,
  createdAt: true,
  vehicle: { select: { id: true, title: true, year: true, licensePlate: true } },
  customer: {
    select: { firstName: true, lastName: true, businessName: true, phone: true, email: true },
  },
} satisfies Prisma.SaleSelect;

export type SaleRow = Prisma.SaleGetPayload<{ select: typeof SALE_SELECT }>;

export interface ListSalesParams {
  page: number;
  status?: SaleStatus;
  // Ventas con entrega programada dentro de los próximos N días.
  deliveryWithinDays?: number;
}

export async function listSales(ctx: ServiceContext, params: ListSalesParams) {
  assertAccountActive(ctx, "sales.list");

  const now = new Date();
  const where: Prisma.SaleWhereInput = {
    dealershipId: ctx.dealership.id,
    ...(params.status ? { status: params.status } : {}),
    ...(params.deliveryWithinDays
      ? {
          status: { notIn: ["cancelled", "completed"] },
          deliveryDate: { gte: now, lte: new Date(now.getTime() + params.deliveryWithinDays * 86_400_000) },
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      select: SALE_SELECT,
      orderBy: params.deliveryWithinDays ? { deliveryDate: "asc" } : { createdAt: "desc" },
      ...pageArgs(params.page),
    }),
  ]);

  logger.info(ctx.requestId, "sales.list.ok", logMeta(ctx, { total }));
  return { items, ...pageMeta(total, params.page) };
}

export async function getSale(ctx: ServiceContext, saleId: string): Promise<SaleRow> {
  assertAccountActive(ctx, "sales.detail");
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, dealershipId: ctx.dealership.id },
    select: SALE_SELECT,
  });
  if (!sale) throw new ServiceError("not_found", "Venta no encontrada");
  return sale;
}
