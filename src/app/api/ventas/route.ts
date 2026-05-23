import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saleCreateSchema } from "@/lib/validators/sale";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { Prisma } from "@prisma/client";

// GET /api/ventas
// Lista paginada de ventas con cliente y vehículo incluídos.
// Query params: page (default 1), limit (default 20), status (opcional)
export const GET = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "sales.list.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "sales.list.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const status = searchParams.get("status") ?? undefined;

  const where: Prisma.SaleWhereInput = {
    dealershipId: dealership.id,
    ...(status ? { status } : {}),
  };

  const [total, sales] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            type: true,
            firstName: true,
            lastName: true,
            businessName: true,
            documentType: true,
            documentNumber: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            title: true,
            brand: true,
            model: true,
            year: true,
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
    }),
  ]);

  logger.info(requestId, "sales.list.ok", {
    dealershipId: dealership.id,
    total,
    page,
    limit,
  });

  return NextResponse.json({
    data: sales,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

// POST /api/ventas
// Crea una venta. Verifica que el vehículo esté disponible y pertenezca al concesionario.
// Al crear, cambia el status del vehículo a "reserved".
export const POST = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "sales.create.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "sales.create.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const body: unknown = await request.json();
  const parsed = saleCreateSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn(requestId, "sales.create.invalid_input", {
      dealershipId: dealership.id,
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { vehicleId, customerId, salePrice, currency, depositAmount, depositDate, notes } =
    parsed.data;

  // Verificar que el vehículo existe, pertenece al concesionario y está disponible.
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, dealershipId: dealership.id },
    select: { id: true, status: true },
  });

  if (!vehicle) {
    logger.warn(requestId, "sales.create.vehicle_not_found", {
      dealershipId: dealership.id,
      vehicleId,
    });
    return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
  }

  if (vehicle.status !== "available") {
    logger.warn(requestId, "sales.create.vehicle_not_available", {
      dealershipId: dealership.id,
      vehicleId,
      status: vehicle.status,
    });
    return NextResponse.json(
      { error: "El vehículo no está disponible para la venta" },
      { status: 409 }
    );
  }

  // Verificar que el cliente pertenece al concesionario.
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, dealershipId: dealership.id },
    select: { id: true },
  });

  if (!customer) {
    logger.warn(requestId, "sales.create.customer_not_found", {
      dealershipId: dealership.id,
      customerId,
    });
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  // Transacción: crear venta + cambiar status del vehículo.
  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        dealershipId: dealership.id,
        vehicleId,
        customerId,
        salePrice,
        currency,
        ...(depositAmount !== undefined ? { depositAmount } : {}),
        ...(depositDate ? { depositDate: new Date(depositDate) } : {}),
        notes,
        status: "draft",
      },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, businessName: true } },
        vehicle: { select: { id: true, title: true } },
      },
    });

    await tx.vehicle.update({
      where: { id: vehicleId },
      data: { status: "reserved" },
    });

    return created;
  });

  // Invalidamos el cache de stats — el dashboard de ventas lo consume.
  revalidateTag("sales-stats");

  logger.info(requestId, "sales.create.ok", {
    dealershipId: dealership.id,
    saleId: sale.id,
    vehicleId,
    customerId,
  });

  return NextResponse.json({ data: sale }, { status: 201 });
});
