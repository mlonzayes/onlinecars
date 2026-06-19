/**
 * GET  /api/vehiculos/[id]/gastos  → lista de gastos del vehículo
 * POST /api/vehiculos/[id]/gastos  → crea un gasto
 *
 * Gastos = info de costo. Ver requiere canSeeCosts; crear requiere admin
 * (canEditCosts). Siempre se filtra por dealershipId (multi-tenancy).
 *
 * POST request:  { "category": "mecanica", "amount": 350000, "currency": "ARS",
 *                  "description": "Cambio de correa", "date": "2026-06-19" }
 * POST response: { "data": { "id": "cmx..." } }  (201)
 * GET response:  { "data": [ { id, category, description, amount, currency, date, createdAt } ] }
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { canSeeCosts, canEditCosts } from "@/lib/permissions";
import { invalidateDashboardHomeData } from "@/lib/dashboard-cache";
import { vehicleExpenseCreateSchema } from "@/lib/validators/vehicle-expense";

type RouteParams = { id: string };

export const GET = withLogger<RouteParams>(async (_request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const dealership = await getCurrentDealership();
  if (!dealership) {
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }
  if (!canSeeCosts(dealership.currentUser, dealership)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: params.id, dealershipId: dealership.id },
    select: { id: true },
  });
  if (!vehicle) return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });

  const expenses = await prisma.vehicleExpense.findMany({
    where: { vehicleId: params.id, dealershipId: dealership.id },
    orderBy: { date: "desc" },
  });

  logger.info(requestId, "vehiculos.expenses.list", {
    vehicleId: params.id,
    count: expenses.length,
  });

  // Serializar Decimal/fechas antes de devolver.
  const data = expenses.map((e) => ({
    id: e.id,
    category: e.category,
    description: e.description,
    amount: e.amount.toString(),
    currency: e.currency,
    date: e.date.toISOString(),
    createdAt: e.createdAt.toISOString(),
  }));

  return NextResponse.json({ data });
});

export const POST = withLogger<RouteParams>(async (request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const dealership = await getCurrentDealership();
  if (!dealership) {
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }
  // Cargar gastos modifica el costo/margen → solo admin.
  if (!canEditCosts(dealership.currentUser)) {
    return NextResponse.json(
      { error: "Solo un administrador puede cargar gastos" },
      { status: 403 }
    );
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: params.id, dealershipId: dealership.id },
    select: { id: true },
  });
  if (!vehicle) return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });

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

  const { category, description, amount, currency, date } = parsed.data;
  const expense = await prisma.vehicleExpense.create({
    data: {
      dealershipId: dealership.id,
      vehicleId: params.id,
      category,
      description: description?.trim() || null,
      amount,
      currency,
      ...(date ? { date } : {}),
    },
    select: { id: true },
  });

  // El gasto cambia el margen real; si el auto está vendido, también la ganancia
  // neta del dashboard. Invalidamos el cache para que se refleje al instante.
  await invalidateDashboardHomeData(dealership.id);

  logger.info(requestId, "vehiculos.expenses.created", {
    vehicleId: params.id,
    expenseId: expense.id,
  });

  return NextResponse.json({ data: { id: expense.id } }, { status: 201 });
});
