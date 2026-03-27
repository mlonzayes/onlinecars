import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { waitlistSchema } from "@/lib/validators/waitlist";

// POST /api/waitlist — Registrarse en la lista de espera
// Body: { email, name?, dealership?, phone? }
// Response 201: { data: { id, email, createdAt } }
// Response 400: { error: "Datos inválidos", details: ... }
// Response 409: { error: "Este email ya está registrado" }
// Response 500: { error: "Error interno del servidor" }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = waitlistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const entry = await prisma.waitlistEntry.create({
      data: parsed.data,
      select: { id: true, email: true, createdAt: true },
    });

    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (error: unknown) {
    // Email duplicado (unique constraint de Prisma)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Este email ya está registrado" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
