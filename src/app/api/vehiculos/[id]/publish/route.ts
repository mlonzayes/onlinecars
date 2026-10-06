import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { getDashboardContext, withServiceErrors } from "@/lib/services/dashboard-context";
import { toggleVehiclePublished } from "@/lib/services/vehicles";

type VehicleParams = { id: string };

// PATCH /api/vehiculos/[id]/publish
// Toggle publicado/despublicado. Publicar valida el límite del plan.
// Response 200: { data: { id, publishedAt } } · 403 si se alcanzó el límite
export const PATCH = withLogger<VehicleParams>(async (_request, { requestId, params }) => {
  const ctx = await getDashboardContext(requestId, "vehicles.publish");
  if (ctx instanceof NextResponse) return ctx;

  return withServiceErrors(async () => {
    const vehicle = await toggleVehiclePublished(ctx, params.id);
    return NextResponse.json({ data: vehicle });
  });
});
