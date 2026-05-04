import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerCreateSchema } from "@/lib/validators/customer";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { Prisma } from "@prisma/client";

// GET /api/clientes
// Lista paginada de clientes del concesionario autenticado.
// Query params: page (default 1), limit (default 20), search (opcional, sobre nombre/razón/documento)
export const GET = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "customers.list.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "customers.list.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const search = searchParams.get("search")?.trim() ?? "";

  const where: Prisma.CustomerWhereInput = {
    dealershipId: dealership.id,
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { businessName: { contains: search, mode: "insensitive" } },
            { documentNumber: { contains: search } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  logger.info(requestId, "customers.list.ok", {
    dealershipId: dealership.id,
    total,
    page,
    limit,
  });

  return NextResponse.json({
    data: customers,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// POST /api/clientes
// Crea un cliente para el concesionario autenticado.
// Body: CustomerCreateInput
export const POST = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "customers.create.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "customers.create.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const body: unknown = await request.json();
  const parsed = customerCreateSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn(requestId, "customers.create.invalid_input", {
      dealershipId: dealership.id,
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        ...parsed.data,
        dealershipId: dealership.id,
      },
    });

    logger.info(requestId, "customers.create.ok", {
      dealershipId: dealership.id,
      customerId: customer.id,
      documentType: customer.documentType,
    });

    return NextResponse.json({ data: customer }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      logger.warn(requestId, "customers.create.duplicate_document", {
        dealershipId: dealership.id,
        documentType: parsed.data.documentType,
      });
      return NextResponse.json(
        {
          error: "Ya existe un cliente con ese documento",
          details: { fieldErrors: { documentNumber: ["Ya está registrado"] } },
        },
        { status: 409 }
      );
    }
    throw error;
  }
});
