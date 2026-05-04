import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { LEAD_STATUSES } from "@/lib/constants";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";

type LeadParams = { id: string };

const leadUpdateSchema = z.object({
  status: z.enum(LEAD_STATUSES),
});

// GET /api/leads/[id]
// Devuelve el detalle del lead. Si estaba en "new", lo marca como "contacted" automáticamente.
// Verifica que el lead pertenece al concesionario del usuario autenticado.
export const GET = withLogger<LeadParams>(async (_request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "leads.detail.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "leads.detail.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id } = params;

  const lead = await prisma.lead.findFirst({
    where: { id, dealershipId: dealership.id },
    include: {
      vehicle: {
        select: { id: true, title: true, brand: true, model: true, year: true },
      },
    },
  });

  if (!lead) {
    logger.warn(requestId, "leads.detail.not_found", {
      dealershipId: dealership.id,
      leadId: id,
    });
    return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
  }

  if (lead.status === "new") {
    await prisma.lead.update({
      where: { id },
      data: { status: "contacted" },
    });
    logger.info(requestId, "leads.detail.auto_marked_contacted", {
      dealershipId: dealership.id,
      leadId: id,
    });
    return NextResponse.json({ data: { ...lead, status: "contacted" } });
  }

  logger.info(requestId, "leads.detail.ok", {
    dealershipId: dealership.id,
    leadId: id,
    status: lead.status,
  });
  return NextResponse.json({ data: lead });
});

// PATCH /api/leads/[id]
// Actualiza el estado del lead.
// Body: { status: "new" | "contacted" | "qualified" | "closed" }
//
// Ejemplo:
//   PATCH /api/leads/clxxxxxxx
//   { "status": "qualified" }
//   → 200: { data: Lead }
export const PATCH = withLogger<LeadParams>(async (request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "leads.update.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "leads.update.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id } = params;

  const body: unknown = await request.json();
  const parsed = leadUpdateSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn(requestId, "leads.update.invalid_input", {
      dealershipId: dealership.id,
      leadId: id,
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const lead = await prisma.lead.update({
      where: { id, dealershipId: dealership.id },
      data: { status: parsed.data.status },
      include: {
        vehicle: {
          select: { id: true, title: true, brand: true, model: true, year: true },
        },
      },
    });

    logger.info(requestId, "leads.update.ok", {
      dealershipId: dealership.id,
      leadId: id,
      status: lead.status,
    });

    return NextResponse.json({ data: lead });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      logger.warn(requestId, "leads.update.not_found", {
        dealershipId: dealership.id,
        leadId: id,
      });
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }
    throw error;
  }
});

// DELETE /api/leads/[id]
// Elimina el lead. Verifica que pertenece al concesionario del usuario.
//
// Ejemplo:
//   DELETE /api/leads/clxxxxxxx
//   → 200: { data: { id: "clxxxxxxx" } }
export const DELETE = withLogger<LeadParams>(async (_request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "leads.delete.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "leads.delete.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id } = params;

  try {
    await prisma.lead.delete({
      where: { id, dealershipId: dealership.id },
    });

    logger.info(requestId, "leads.delete.ok", {
      dealershipId: dealership.id,
      leadId: id,
    });

    return NextResponse.json({ data: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      logger.warn(requestId, "leads.delete.not_found", {
        dealershipId: dealership.id,
        leadId: id,
      });
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }
    throw error;
  }
});
