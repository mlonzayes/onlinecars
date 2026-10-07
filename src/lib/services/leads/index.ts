import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { LeadSource, LeadStatus } from "@/lib/constants";
import { assertAccountActive, logMeta, type ServiceContext } from "../context";
import { ServiceError } from "../service-error";
import { daysAgo, pageArgs, pageMeta } from "../pagination";

export interface ListLeadsParams {
  page: number;
  status?: LeadStatus;
  source?: LeadSource;
  vehicleId?: string;
  search?: string;
  lastDays?: number;
}

const LEAD_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  message: true,
  source: true,
  status: true,
  quoteData: true,
  createdAt: true,
  vehicle: { select: { id: true, title: true, year: true, licensePlate: true } },
} satisfies Prisma.LeadSelect;

export type LeadRow = Prisma.LeadGetPayload<{ select: typeof LEAD_SELECT }>;

export async function listLeads(ctx: ServiceContext, params: ListLeadsParams) {
  assertAccountActive(ctx, "leads.list");
  const tokens = (params.search ?? "").split(/\s+/).filter(Boolean);

  const where: Prisma.LeadWhereInput = {
    dealershipId: ctx.dealership.id,
    ...(params.status ? { status: params.status } : {}),
    ...(params.source ? { source: params.source } : {}),
    ...(params.vehicleId ? { vehicleId: params.vehicleId } : {}),
    ...(params.lastDays ? { createdAt: { gte: daysAgo(params.lastDays) } } : {}),
    ...(tokens.length > 0
      ? {
          AND: tokens.map((token) => ({
            OR: [
              { name: { contains: token, mode: "insensitive" as const } },
              { phone: { contains: token } },
              { email: { contains: token, mode: "insensitive" as const } },
              { vehicle: { title: { contains: token, mode: "insensitive" as const } } },
            ],
          })),
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      select: LEAD_SELECT,
      orderBy: { createdAt: "desc" },
      ...pageArgs(params.page),
    }),
  ]);

  logger.info(ctx.requestId, "leads.list.ok", logMeta(ctx, { total }));
  return { items, ...pageMeta(total, params.page) };
}

export async function getLead(ctx: ServiceContext, leadId: string): Promise<LeadRow> {
  assertAccountActive(ctx, "leads.detail");
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, dealershipId: ctx.dealership.id },
    select: LEAD_SELECT,
  });
  if (!lead) throw new ServiceError("not_found", "Consulta no encontrada");
  return lead;
}
