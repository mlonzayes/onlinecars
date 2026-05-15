import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { vehicleCreateSchema } from "@/lib/validators/vehicle";
import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { invalidateTenantHomeBundle } from "@/lib/tenant";

// GET /api/vehiculos
// Lista paginada de vehículos del concesionario autenticado.
// Query params: page (default 1), limit (default 12), status (opcional), search (opcional)
export const GET = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "vehicles.list.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "vehicles.list.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)));
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const where = {
    dealershipId: dealership.id,
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

  logger.info(requestId, "vehicles.list.ok", {
    dealershipId: dealership.id,
    total,
    page,
    limit,
  });

  return NextResponse.json({
    data: vehicles,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// POST /api/vehiculos
// Crea un nuevo vehículo para el concesionario autenticado.
// Body: VehicleCreateInput
export const POST = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "vehicles.create.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "vehicles.create.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const body: unknown = await request.json();
  const parsed = vehicleCreateSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn(requestId, "vehicles.create.invalid_input", {
      dealershipId: dealership.id,
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      ...parsed.data,
      // Prisma espera Decimal para price — lo convertimos explícitamente
      price: parsed.data.price,
      dealershipId: dealership.id,
    },
  });

  await invalidateTenantHomeBundle(dealership.slug);

  logger.info(requestId, "vehicles.create.ok", {
    dealershipId: dealership.id,
    vehicleId: vehicle.id,
  });

  return NextResponse.json({ data: vehicle }, { status: 201 });
});
