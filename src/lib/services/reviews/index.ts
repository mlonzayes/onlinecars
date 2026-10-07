import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { assertAccountActive, logMeta, type ServiceContext } from "../context";
import { pageArgs, pageMeta } from "../pagination";

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export async function listReviews(ctx: ServiceContext, params: { page: number; status: ReviewStatus }) {
  assertAccountActive(ctx, "reviews.list");
  const where = { dealershipId: ctx.dealership.id, status: params.status };

  const [total, items] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      select: { id: true, name: true, content: true, rating: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      ...pageArgs(params.page),
    }),
  ]);

  logger.info(ctx.requestId, "reviews.list.ok", logMeta(ctx, { total }));
  return { items, ...pageMeta(total, params.page) };
}
