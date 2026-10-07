import { NextResponse } from "next/server";
import { z } from "zod";
import { VEHICLE_STATUSES } from "@/lib/constants";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { getDashboardContext, withServiceErrors } from "@/lib/services/dashboard-context";
import { setVehicleStatus } from "@/lib/services/vehicles";

type VehicleParams = { id: string };

const statusUpdateSchema = z.object({
  status: z.enum(VEHICLE_STATUSES),
});

// PATCH /api/vehiculos/[id]/status
// Cambia el status del vehículo.
// Body: { status: "available" | "reserved" | "sold" }
// Ejemplo: PATCH /api/vehiculos/abc123/status  { "status": "sold" }
// Response 200: { data: { id, status } } · 409 si tiene venta activa
export const PATCH = withLogger<VehicleParams>(async (request, { requestId, params }) => {
  const ctx = await getDashboardContext(requestId, "vehicles.status");
  if (ctx instanceof NextResponse) return ctx;

  const body: unknown = await request.json();
  const parsed = statusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    logger.warn(requestId, "vehicles.status.invalid_input", {
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
    const vehicle = await setVehicleStatus(ctx, params.id, parsed.data.status);
    return NextResponse.json({ data: vehicle });
  });
});
