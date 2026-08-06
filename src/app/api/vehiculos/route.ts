import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { vehicleCreateSchema } from "@/lib/validators/vehicle";
import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { invalidateVehicleCaches } from "@/lib/cache-tags";
import { canSeeCosts, canEditCosts } from "@/lib/permissions";
import { generateVehicleSlug } from "@/lib/utils/slug";

// Sacamos costPrice/costCurrency de una lista de vehículos si el user no tiene permiso.
// Devolvemos `null` en vez de `undefined` para no romper el shape de la response.
function projectCosts<T extends { costPrice: unknown; costCurrency: unknown }>(
  vehicles: T[],
  allowed: boolean
): T[] {
  if (allowed) return vehicles;
  return vehicles.map((v) => ({ ...v, costPrice: null, costCurrency: null }));
}

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

  const allowedCosts = canSeeCosts(dealership.currentUser, dealership);
  const projected = projectCosts(vehicles, allowedCosts);

  logger.info(requestId, "vehicles.list.ok", {
    dealershipId: dealership.id,
    total,
    page,
    limit,
  });

  return NextResponse.json({
    data: projected,
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

  // Solo admins pueden setear costPrice/costCurrency. Si un editor/viewer
  // intenta mandarlos en el body, los descartamos en silencio (no error).
  const { costPrice, costCurrency, ...rest } = parsed.data;
  const allowedToEditCosts = canEditCosts(dealership.currentUser);

  // publicSlug: identificador URL-friendly único por dealer. Generamos uno
  // aleatorio con sufijo hex; en el caso EXTREMADAMENTE raro de colisión con
  // otro vehículo del mismo dealer, reintentamos hasta 3 veces. Probabilidad
  // de colisión: ~1 en 4 mil millones por brand+model+year. 3 retries dan
  // certeza práctica.
  const MAX_SLUG_RETRIES = 3;
  let vehicle = null as Awaited<ReturnType<typeof prisma.vehicle.create>> | null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
    const publicSlug = generateVehicleSlug(rest.brand, rest.model, rest.year);
    try {
      vehicle = await prisma.vehicle.create({
        data: {
          ...rest,
          price: parsed.data.price,
          ...(allowedToEditCosts
            ? { costPrice: costPrice ?? null, costCurrency: costCurrency ?? null }
            : {}),
          dealershipId: dealership.id,
          publicSlug,
        },
      });
      break;
    } catch (err) {
      lastError = err;
      // P2002 = unique constraint violation. Solo reintentamos si fue por
      // publicSlug; cualquier otro target (VIN, motorNumber, etc.) NO debe
      // disparar retry — es un duplicado real que el user tiene que resolver.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        Array.isArray(err.meta?.target) &&
        (err.meta.target as string[]).includes("publicSlug")
      ) {
        logger.warn(requestId, "vehicles.create.slug_collision", {
          dealershipId: dealership.id,
          attempt: attempt + 1,
        });
        continue;
      }
      throw err;
    }
  }

  if (!vehicle) {
    logger.error(requestId, "vehicles.create.slug_exhausted_retries", {
      dealershipId: dealership.id,
      error: lastError instanceof Error ? lastError.message : String(lastError),
    });
    return NextResponse.json(
      { error: "No se pudo generar un identificador único. Intentá de nuevo." },
      { status: 500 }
    );
  }

  await invalidateVehicleCaches(dealership.slug);

  logger.info(requestId, "vehicles.create.ok", {
    dealershipId: dealership.id,
    vehicleId: vehicle.id,
    publicSlug: vehicle.publicSlug,
  });

  return NextResponse.json({ data: vehicle }, { status: 201 });
});
