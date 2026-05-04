import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerUpdateSchema } from "@/lib/validators/customer";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { Prisma } from "@prisma/client";

type CustomerParams = { id: string };

// GET /api/clientes/[id]
// Devuelve el detalle del cliente. Verifica multi-tenancy.
export const GET = withLogger<CustomerParams>(async (_request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "customers.detail.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "customers.detail.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id } = params;

  const customer = await prisma.customer.findFirst({
    where: { id, dealershipId: dealership.id },
  });

  if (!customer) {
    logger.warn(requestId, "customers.detail.not_found", {
      dealershipId: dealership.id,
      customerId: id,
    });
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ data: customer });
});

// PUT /api/clientes/[id]
// Actualiza datos del cliente. Body: CustomerUpdateInput.
export const PUT = withLogger<CustomerParams>(async (request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "customers.update.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "customers.update.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id } = params;

  const body: unknown = await request.json();
  const parsed = customerUpdateSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn(requestId, "customers.update.invalid_input", {
      dealershipId: dealership.id,
      customerId: id,
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const customer = await prisma.customer.update({
      where: { id, dealershipId: dealership.id },
      data: parsed.data,
    });

    logger.info(requestId, "customers.update.ok", {
      dealershipId: dealership.id,
      customerId: id,
    });

    return NextResponse.json({ data: customer });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
      }
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            error: "Ya existe un cliente con ese documento",
            details: { fieldErrors: { documentNumber: ["Ya está registrado"] } },
          },
          { status: 409 }
        );
      }
    }
    throw error;
  }
});

// DELETE /api/clientes/[id]
// Borra un cliente. Si tiene ventas asociadas, devuelve 409 (FK Restrict).
export const DELETE = withLogger<CustomerParams>(async (_request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "customers.delete.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "customers.delete.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id } = params;

  try {
    await prisma.customer.delete({
      where: { id, dealershipId: dealership.id },
    });

    logger.info(requestId, "customers.delete.ok", {
      dealershipId: dealership.id,
      customerId: id,
    });

    return NextResponse.json({ data: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
      }
      if (error.code === "P2003") {
        return NextResponse.json(
          { error: "El cliente tiene ventas asociadas y no se puede eliminar" },
          { status: 409 }
        );
      }
    }
    throw error;
  }
});
