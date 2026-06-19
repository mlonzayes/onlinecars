/**
 * DELETE /api/vehiculos/[id]/gastos/[expenseId]  → elimina un gasto
 *
 * Solo admin (canEditCosts). Filtra por dealershipId y vehicleId (multi-tenancy).
 * DELETE response: { "data": { "id": "cmx..." } }
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { canEditCosts } from "@/lib/permissions";
import { invalidateDashboardHomeData } from "@/lib/dashboard-cache";

type RouteParams = { id: string; expenseId: string };

export const DELETE = withLogger<RouteParams>(async (_request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const dealership = await getCurrentDealership();
  if (!dealership) {
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }
  if (!canEditCosts(dealership.currentUser)) {
    return NextResponse.json(
      { error: "Solo un administrador puede eliminar gastos" },
      { status: 403 }
    );
  }

  // deleteMany filtrando por tenant + vehículo: si el gasto no es de este dealer,
  // count = 0 y devolvemos 404 sin filtrar de qué tenant era.
  const result = await prisma.vehicleExpense.deleteMany({
    where: {
      id: params.expenseId,
      vehicleId: params.id,
      dealershipId: dealership.id,
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });
  }

  // Recalcular el dashboard: el gasto borrado puede cambiar la ganancia neta.
  await invalidateDashboardHomeData(dealership.id);

  logger.info(requestId, "vehiculos.expenses.deleted", {
    vehicleId: params.id,
    expenseId: params.expenseId,
  });

  return NextResponse.json({ data: { id: params.expenseId } });
});
