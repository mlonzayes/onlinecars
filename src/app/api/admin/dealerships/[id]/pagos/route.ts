/**
 * POST /api/admin/dealerships/[id]/pagos → super-admin registra un pago de suscripción.
 *
 * Efecto: guarda el pago en el histórico, extiende Dealership.paidUntil +1 mes y,
 * si la cuenta estaba en trial, la pasa a "active" (cobrar = es cliente).
 * Solo super-admin (isSuperAdmin), cross-tenant.
 *
 * POST request:  { "amount": 25000, "currency": "ARS", "method": "transferencia", "notes": "Junio" }
 * POST response: { "data": { "paidUntil": "2026-07-19T..." } }
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { isSuperAdmin } from "@/lib/super-admin";
import { subscriptionPaymentCreateSchema } from "@/lib/validators/subscription-payment";

type RouteParams = { id: string };

function addOneMonth(d: Date): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + 1);
  return r;
}

export const POST = withLogger<RouteParams>(async (request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId || !isSuperAdmin(userId)) {
    logger.warn(requestId, "admin.payment.create.forbidden", { userId });
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body: unknown = await request.json();
  const parsed = subscriptionPaymentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const dealership = await prisma.dealership.findUnique({
    where: { id: params.id },
    select: { id: true, paidUntil: true, subscriptionStatus: true },
  });
  if (!dealership) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }

  const now = new Date();
  // Si está al día, extiende desde el vencimiento (no pierde días pagados de más);
  // si está vencido, el pago cubre desde hoy.
  const base =
    dealership.paidUntil && dealership.paidUntil > now ? dealership.paidUntil : now;
  const newPaidUntil = addOneMonth(base);

  const { amount, currency, method, notes } = parsed.data;

  await prisma.$transaction([
    prisma.subscriptionPayment.create({
      data: {
        dealershipId: dealership.id,
        amount,
        currency,
        method: method?.trim() || null,
        notes: notes?.trim() || null,
        paidUntil: newPaidUntil,
        createdByClerkUserId: userId,
      },
    }),
    prisma.dealership.update({
      where: { id: dealership.id },
      data: {
        paidUntil: newPaidUntil,
        // Cobrar un pago convierte el trial en cliente activo.
        ...(dealership.subscriptionStatus === "trial"
          ? { subscriptionStatus: "active" }
          : {}),
      },
    }),
  ]);

  logger.info(requestId, "admin.payment.create.ok", {
    dealershipId: dealership.id,
    amount,
    paidUntil: newPaidUntil.toISOString(),
  });

  return NextResponse.json({ data: { paidUntil: newPaidUntil.toISOString() } });
});
