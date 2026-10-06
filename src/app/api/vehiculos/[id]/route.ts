import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { vehicleUpdateSchema } from "@/lib/validators/vehicle";
import { getDashboardContext, withServiceErrors } from "@/lib/services/dashboard-context";
import { deleteVehicle, getVehicle, updateVehicle } from "@/lib/services/vehicles";

type VehicleParams = { id: string };

// GET /api/vehiculos/[id]
// Detalle de un vehículo del concesionario autenticado, con sus imágenes.
// Response 200: { data: Vehicle & { images: VehicleImage[] } }
export const GET = withLogger<VehicleParams>(async (_request, { requestId, params }) => {
  const ctx = await getDashboardContext(requestId, "vehicles.detail");
  if (ctx instanceof NextResponse) return ctx;

  return withServiceErrors(async () => {
    const vehicle = await getVehicle(ctx, params.id);
    return NextResponse.json({ data: vehicle });
  });
});

// PUT /api/vehiculos/[id]
// Actualización parcial (todos los campos son opcionales).
// Ejemplo: { "price": 21900, "description": "..." }
// Response 200: { data: Vehicle } · 409 si tiene venta activa · 403 si publicar excede el plan
export const PUT = withLogger<VehicleParams>(async (request, { requestId, params }) => {
  const ctx = await getDashboardContext(requestId, "vehicles.update");
  if (ctx instanceof NextResponse) return ctx;

  const body: unknown = await request.json();
  const parsed = vehicleUpdateSchema.safeParse(body);
  if (!parsed.success) {
    logger.warn(requestId, "vehicles.update.invalid_input", {
      dealershipId: ctx.dealership.id,
      vehicleId: params.id,
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  return withServiceErrors(async () => {
    const vehicle = await updateVehicle(ctx, params.id, parsed.data);
    return NextResponse.json({ data: vehicle });
  });
});

// DELETE /api/vehiculos/[id]
// Elimina un vehículo (las imágenes caen por cascade).
// Response 200: { data: { id } } · 409 si tiene venta activa
export const DELETE = withLogger<VehicleParams>(async (_request, { requestId, params }) => {
  const ctx = await getDashboardContext(requestId, "vehicles.delete");
  if (ctx instanceof NextResponse) return ctx;

  return withServiceErrors(async () => {
    await deleteVehicle(ctx, params.id);
    return NextResponse.json({ data: { id: params.id } });
  });
});
