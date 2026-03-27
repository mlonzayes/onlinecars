import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/vehiculos/[id]/publish
// Toggle publicado/despublicado.
// Si publishedAt es null → publica (setea fecha actual).
// Si tiene fecha → despublica (setea null).
export async function PATCH(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id } = await params;

  // Primero buscamos el vehículo para conocer el estado actual de publishedAt
  const existing = await prisma.vehicle.findFirst({
    where: { id, dealershipId: dealership.id },
    select: { publishedAt: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
  }

  const newPublishedAt = existing.publishedAt ? null : new Date();

  try {
    const vehicle = await prisma.vehicle.update({
      where: { id, dealershipId: dealership.id },
      data: { publishedAt: newPublishedAt },
      select: { id: true, publishedAt: true },
    });

    return NextResponse.json({ data: vehicle });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
    }
    throw error;
  }
}
