/**
 * DELETE /api/vehiculos/[id]/gastos/[expenseId]  → elimina un gasto
 *
 * Solo admin (canEditCosts). Filtra por dealershipId y vehicleId (multi-tenancy).
 * DELETE response: { "data": { "id": "cmx..." } }
 */
import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { getDashboardContext, withServiceErrors } from "@/lib/services/dashboard-context";
import { deleteExpense } from "@/lib/services/expenses";

type RouteParams = { id: string; expenseId: string };

export const DELETE = withLogger<RouteParams>(async (_request, { requestId, params }) => {
  const ctx = await getDashboardContext(requestId, "vehiculos.expenses.delete");
  if (ctx instanceof NextResponse) return ctx;

  return withServiceErrors(async () => {
    await deleteExpense(ctx, params.id, params.expenseId);
    return NextResponse.json({ data: { id: params.expenseId } });
  });
});
