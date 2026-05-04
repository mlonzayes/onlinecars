import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { waitlistSchema } from "@/lib/validators/waitlist";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";

// POST /api/waitlist — Registrarse en la lista de espera
// Body: { email, name?, dealership?, phone? }
// Response 201: { data: { id, email, createdAt } }
// Response 400: { error: "Datos inválidos", details: ... }
// Response 409: { error: "Este email ya está registrado" }
// Response 500: { error: "Error interno del servidor", requestId }
export const POST = withLogger(async (req, { requestId }) => {
  const body = await req.json();
  const parsed = waitlistSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn(requestId, "waitlist.invalid_input", {
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const entry = await prisma.waitlistEntry.create({
      data: parsed.data,
      select: { id: true, email: true, createdAt: true },
    });

    logger.info(requestId, "waitlist.created", { entryId: entry.id });
    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      logger.warn(requestId, "waitlist.duplicate_email");
      return NextResponse.json(
        { error: "Este email ya está registrado" },
        { status: 409 }
      );
    }
    // Errores no manejados se propagan al wrapper, que loggea con stack y devuelve 500.
    throw error;
  }
});
