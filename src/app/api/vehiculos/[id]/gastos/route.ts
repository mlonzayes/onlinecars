/**
 * GET  /api/vehiculos/[id]/gastos  → lista de gastos del vehículo
 * POST /api/vehiculos/[id]/gastos  → crea un gasto
 *
 * Gastos = info de costo. Ver requiere canSeeCosts; crear requiere admin
 * (canEditCosts). La lógica vive en src/lib/services/expenses.
 *
 * POST request:  { "category": "pulido", "amount": 150000, "currency": "ARS",
 *                  "description": "Detailing completo en Lavadero Norte", "date": "2026-06-19" }
 * POST response: { "data": { "id": "cmx..." } }  (201)
 * GET response:  { "data": [ { id, category, description, amount, currency, date, createdAt } ] }
 */
import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { vehicleExpenseCreateSchema } from "@/lib/validators/vehicle-expense";
import { getDashboardContext, withServiceErrors } from "@/lib/services/dashboard-context";
import { createExpense, listExpenses } from "@/lib/services/expenses";

type RouteParams = { id: string };

export const GET = withLogger<RouteParams>(async (_request, { requestId, params }) => {
  const ctx = await getDashboardContext(requestId, "vehiculos.expenses.list");
  if (ctx instanceof NextResponse) return ctx;

  return withServiceErrors(async () => {
    const data = await listExpenses(ctx, params.id);
    return NextResponse.json({ data });
  });
});

export const POST = withLogger<RouteParams>(async (request, { requestId, params }) => {
  const ctx = await getDashboardContext(requestId, "vehiculos.expenses.create");
  if (ctx instanceof NextResponse) return ctx;

  const body: unknown = await request.json();
  const parsed = vehicleExpenseCreateSchema.safeParse(body);
  if (!parsed.success) {
    logger.warn(requestId, "vehiculos.expenses.invalid_input", {
      vehicleId: params.id,
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  return withServiceErrors(async () => {
    const expense = await createExpense(ctx, params.id, parsed.data);
    return NextResponse.json({ data: expense }, { status: 201 });
  });
});
