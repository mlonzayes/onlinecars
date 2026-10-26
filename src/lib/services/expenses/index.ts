import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { canEditCosts, canSeeCosts } from "@/lib/permissions";
import { invalidateDashboardHomeData } from "@/lib/dashboard-cache";
import { assertAccountActive, logMeta, type ServiceContext } from "../context";
import { ServiceError } from "../service-error";
import { auditSnapshot, recordAudit } from "../audit";
import { vehicleNotFound } from "../vehicles/guards";
import type { VehicleExpenseCreateInput } from "@/lib/validators/vehicle-expense";

// Gastos = información de costo. Ver exige canSeeCosts; cargar o borrar exige
// admin (canEditCosts) porque mueven el margen y la ganancia neta.

const EXPENSE_AUDIT_FIELDS = ["vehicleId", "category", "description", "amount", "currency", "date"] as const;
const EXPENSE_AUDIT_SELECT = {
  id: true,
  ...Object.fromEntries(EXPENSE_AUDIT_FIELDS.map((f) => [f, true])),
} as { id: true } & Record<(typeof EXPENSE_AUDIT_FIELDS)[number], true>;

export interface ExpenseView {
  id: string;
  category: string;
  description: string | null;
  amount: string;
  currency: string;
  date: string;
  createdAt: string;
}

function assertCanSeeCosts(ctx: ServiceContext, event: string): void {
  assertAccountActive(ctx, event);
  if (canSeeCosts(ctx.dealership.currentUser, ctx.dealership)) return;
  logger.warn(ctx.requestId, `${event}.forbidden`, logMeta(ctx));
  throw new ServiceError("forbidden", "Tu usuario no tiene permiso para ver los costos.");
}

function assertCanEditCosts(ctx: ServiceContext, event: string, action: string): void {
  assertAccountActive(ctx, event);
  if (canEditCosts(ctx.dealership.currentUser)) return;
  logger.warn(ctx.requestId, `${event}.forbidden`, logMeta(ctx));
  throw new ServiceError("forbidden", `Solo un administrador puede ${action} gastos.`);
}

async function assertVehicleExists(ctx: ServiceContext, vehicleId: string, event: string) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, dealershipId: ctx.dealership.id },
    select: { id: true },
  });
  if (!vehicle) throw vehicleNotFound(ctx, vehicleId, event);
}

export async function listExpenses(ctx: ServiceContext, vehicleId: string): Promise<ExpenseView[]> {
  const event = "vehiculos.expenses.list";
  assertCanSeeCosts(ctx, event);
  await assertVehicleExists(ctx, vehicleId, event);

  const expenses = await prisma.vehicleExpense.findMany({
    where: { vehicleId, dealershipId: ctx.dealership.id },
    orderBy: { date: "desc" },
  });
  logger.info(ctx.requestId, event, logMeta(ctx, { vehicleId, count: expenses.length }));

  return expenses.map((e) => ({
    id: e.id,
    category: e.category,
    description: e.description,
    amount: e.amount.toString(),
    currency: e.currency,
    date: e.date.toISOString(),
    createdAt: e.createdAt.toISOString(),
  }));
}

export async function createExpense(
  ctx: ServiceContext,
  vehicleId: string,
  input: VehicleExpenseCreateInput
): Promise<{ id: string }> {
  const event = "vehiculos.expenses.create";
  assertCanEditCosts(ctx, event, "cargar");
  await assertVehicleExists(ctx, vehicleId, event);

  const { category, description, amount, currency, date } = input;
  const expense = await prisma.vehicleExpense.create({
    data: {
      dealershipId: ctx.dealership.id,
      vehicleId,
      category,
      description: description?.trim() || null,
      amount,
      currency,
      ...(date ? { date } : {}),
    },
    select: EXPENSE_AUDIT_SELECT,
  });

  await recordAudit(ctx, {
    action: "expense.create",
    entityType: "expense",
    entityId: expense.id,
    changes: auditSnapshot(expense, EXPENSE_AUDIT_FIELDS),
  });
  // El gasto mueve el margen y, si el auto está vendido, la ganancia neta del
  // dashboard: se invalida para que se vea al instante.
  await invalidateDashboardHomeData(ctx.dealership.id);
  logger.info(ctx.requestId, "vehiculos.expenses.created", logMeta(ctx, { vehicleId, expenseId: expense.id }));
  return { id: expense.id };
}

export async function deleteExpense(
  ctx: ServiceContext,
  vehicleId: string,
  expenseId: string
): Promise<void> {
  const event = "vehiculos.expenses.delete";
  assertCanEditCosts(ctx, event, "eliminar");

  // Filtro por tenant + vehículo: si el gasto es de otro dealer no aparece y
  // respondemos 404 sin revelar de quién era. Se lee antes para la auditoría.
  const where = { id: expenseId, vehicleId, dealershipId: ctx.dealership.id };
  const existing = await prisma.vehicleExpense.findFirst({ where, select: EXPENSE_AUDIT_SELECT });
  const result = existing ? await prisma.vehicleExpense.deleteMany({ where }) : { count: 0 };
  if (!existing || result.count === 0) throw new ServiceError("not_found", "Gasto no encontrado");

  await recordAudit(ctx, {
    action: "expense.delete",
    entityType: "expense",
    entityId: expenseId,
    changes: auditSnapshot(existing, EXPENSE_AUDIT_FIELDS),
  });
  await invalidateDashboardHomeData(ctx.dealership.id);
  logger.info(ctx.requestId, "vehiculos.expenses.deleted", logMeta(ctx, { vehicleId, expenseId }));
}
