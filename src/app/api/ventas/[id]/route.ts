import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saleUpdateSchema } from "@/lib/validators/sale";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { Prisma } from "@prisma/client";

type SaleParams = { id: string };

const SALE_INCLUDE = {
  customer: {
    select: {
      id: true,
      type: true,
      firstName: true,
      lastName: true,
      businessName: true,
      documentType: true,
      documentNumber: true,
      email: true,
      phone: true,
    },
  },
  vehicle: {
    select: {
      id: true,
      title: true,
      brand: true,
      model: true,
      year: true,
      licensePlate: true,
      vin: true,
      images: { where: { isPrimary: true }, take: 1 },
    },
  },
} as const;

// GET /api/ventas/[id]
// Detalle completo de la venta con cliente, vehículo y documentos.
export const GET = withLogger<SaleParams>(async (_request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "sales.detail.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "sales.detail.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id } = params;

  const sale = await prisma.sale.findFirst({
    where: { id, dealershipId: dealership.id },
    include: SALE_INCLUDE,
  });

  if (!sale) {
    logger.warn(requestId, "sales.detail.not_found", {
      dealershipId: dealership.id,
      saleId: id,
    });
    return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ data: sale });
});

// PATCH /api/ventas/[id]
// Actualiza campos de la venta (no el status — eso es /status).
export const PATCH = withLogger<SaleParams>(async (request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "sales.update.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "sales.update.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id } = params;
  const body: unknown = await request.json();
  const parsed = saleUpdateSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn(requestId, "sales.update.invalid_input", {
      dealershipId: dealership.id,
      saleId: id,
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const sale = await prisma.sale.update({
      where: { id, dealershipId: dealership.id },
      data: {
        ...parsed.data,
        ...(parsed.data.depositDate !== undefined
          ? { depositDate: parsed.data.depositDate ? new Date(parsed.data.depositDate) : null }
          : {}),
        ...(parsed.data.invoiceDate !== undefined
          ? { invoiceDate: parsed.data.invoiceDate ? new Date(parsed.data.invoiceDate) : null }
          : {}),
        ...(parsed.data.deliveryDate !== undefined
          ? { deliveryDate: parsed.data.deliveryDate ? new Date(parsed.data.deliveryDate) : null }
          : {}),
      },
      include: SALE_INCLUDE,
    });

    logger.info(requestId, "sales.update.ok", {
      dealershipId: dealership.id,
      saleId: id,
    });

    return NextResponse.json({ data: sale });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    }
    throw error;
  }
});

// DELETE /api/ventas/[id]
// Solo se puede eliminar si status === "draft".
// Restaura el vehículo a "available".
export const DELETE = withLogger<SaleParams>(async (_request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "sales.delete.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "sales.delete.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id } = params;

  const sale = await prisma.sale.findFirst({
    where: { id, dealershipId: dealership.id },
    select: { id: true, status: true, vehicleId: true },
  });

  if (!sale) {
    return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
  }

  if (sale.status !== "draft") {
    logger.warn(requestId, "sales.delete.not_draft", {
      dealershipId: dealership.id,
      saleId: id,
      status: sale.status,
    });
    return NextResponse.json(
      { error: "Solo se pueden eliminar ventas en estado borrador" },
      { status: 409 }
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.sale.delete({ where: { id } });
    await tx.vehicle.update({
      where: { id: sale.vehicleId },
      data: { status: "available" },
    });
  });

  logger.info(requestId, "sales.delete.ok", {
    dealershipId: dealership.id,
    saleId: id,
  });

  return NextResponse.json({ data: { id } });
});
