import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { dealershipCreateSchema } from "@/lib/validators/dealership";

// POST /api/onboarding
// Body: DealershipCreateInput
// Response 201: { data: { dealershipId, slug } }
// Response 400: validación fallida
// Response 401: no autenticado
// Response 409: slug ya en uso o ya tiene concesionario
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Verificar que no tenga concesionario ya
  const existing = await prisma.dealershipUser.findFirst({
    where: { clerkUserId: userId },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Ya tenés un concesionario creado" },
      { status: 409 }
    );
  }

  const body = await req.json();
  const parsed = dealershipCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Verificar slug único
  const slugTaken = await prisma.dealership.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (slugTaken) {
    return NextResponse.json(
      {
        error: "El nombre de sitio ya está en uso. Elegí otro.",
        details: { fieldErrors: { slug: ["Ya está en uso"] } },
      },
      { status: 409 }
    );
  }

  // Crear dealership + dealershipUser en una transacción
  const dealership = await prisma.$transaction(async (tx) => {
    const d = await tx.dealership.create({ data: parsed.data });
    await tx.dealershipUser.create({
      data: { clerkUserId: userId, dealershipId: d.id, role: "admin" },
    });
    return d;
  });

  return NextResponse.json(
    { data: { dealershipId: dealership.id, slug: dealership.slug } },
    { status: 201 }
  );
}
