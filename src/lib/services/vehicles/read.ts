import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { canSeeCosts } from "@/lib/permissions";
import { assertAccountActive, logMeta, type ServiceContext } from "../context";
import { vehicleNotFound } from "./guards";

// Sin permiso, costPrice/costCurrency salen como null (no undefined) para no
// romper el shape que esperan los clientes.
function projectCosts<T extends { costPrice: unknown; costCurrency: unknown }>(
  vehicle: T,
  allowed: boolean
): T {
  return allowed ? vehicle : { ...vehicle, costPrice: null, costCurrency: null };
}

export interface ListVehiclesParams {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}

export async function listVehicles(ctx: ServiceContext, params: ListVehiclesParams) {
  assertAccountActive(ctx, "vehicles.list");
  const { page, limit, status, search } = params;

  const where = {
    dealershipId: ctx.dealership.id,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { brand: { contains: search, mode: "insensitive" as const } },
            { model: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, vehicles] = await Promise.all([
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { images: { where: { isPrimary: true }, take: 1 } },
    }),
  ]);

  const allowedCosts = canSeeCosts(ctx.dealership.currentUser, ctx.dealership);
  logger.info(ctx.requestId, "vehicles.list.ok", logMeta(ctx, { total, page, limit }));

  return { items: vehicles.map((v) => projectCosts(v, allowedCosts)), total };
}

export async function getVehicle(ctx: ServiceContext, vehicleId: string) {
  assertAccountActive(ctx, "vehicles.detail");

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, dealershipId: ctx.dealership.id },
    include: { images: { orderBy: { order: "asc" } } },
  });
  if (!vehicle) throw vehicleNotFound(ctx, vehicleId, "vehicles.detail");

  logger.info(ctx.requestId, "vehicles.detail.ok", logMeta(ctx, { vehicleId }));
  return projectCosts(vehicle, canSeeCosts(ctx.dealership.currentUser, ctx.dealership));
}
