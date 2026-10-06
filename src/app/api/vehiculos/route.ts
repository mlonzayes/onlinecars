import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { vehicleCreateSchema } from "@/lib/validators/vehicle";
import { getDashboardContext, withServiceErrors } from "@/lib/services/dashboard-context";
import { createVehicle, listVehicles } from "@/lib/services/vehicles";

// GET /api/vehiculos
// Lista paginada de vehículos del concesionario autenticado.
// Query params: page (default 1), limit (default 12), status (opcional), search (opcional)
// Ejemplo: GET /api/vehiculos?page=2&status=available&search=corolla
// Response 200: { data: Vehicle[], meta: { total, page, limit, totalPages } }
export const GET = withLogger(async (request, { requestId }) => {
  const ctx = await getDashboardContext(requestId, "vehicles.list");
  if (ctx instanceof NextResponse) return ctx;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)));
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  return withServiceErrors(async () => {
    const { items, total } = await listVehicles(ctx, { page, limit, status, search });
    return NextResponse.json({
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  });
});

// POST /api/vehiculos
// Crea un nuevo vehículo para el concesionario autenticado.
// Body: VehicleCreateInput
// Ejemplo: { "title": "Toyota Corolla XEi", "brand": "Toyota", "model": "Corolla", "year": 2021, "price": 22500, "currency": "USD" }
// Response 201: { data: Vehicle }
export const POST = withLogger(async (request, { requestId }) => {
  const ctx = await getDashboardContext(requestId, "vehicles.create");
  if (ctx instanceof NextResponse) return ctx;

  const body: unknown = await request.json();
  const parsed = vehicleCreateSchema.safeParse(body);
  if (!parsed.success) {
    logger.warn(requestId, "vehicles.create.invalid_input", {
      dealershipId: ctx.dealership.id,
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  return withServiceErrors(async () => {
    const vehicle = await createVehicle(ctx, parsed.data);
    return NextResponse.json({ data: vehicle }, { status: 201 });
  });
});
