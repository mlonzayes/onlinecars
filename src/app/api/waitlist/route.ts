import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { waitlistSchema } from "@/lib/validators/waitlist";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { applyRateLimit, getClientIp, waitlistLimiter } from "@/lib/rate-limit";
import { isHoneypotTriggered } from "@/lib/honeypot";

// POST /api/waitlist — Registrarse en la lista de espera
// Body: { email, name?, dealership?, phone? }
// Response 201: { data: { id, email, createdAt } }
// Response 400: { error: "Datos inválidos", details: ... }
// Response 409: { error: "Este email ya está registrado" }
// Response 429: { error: "Demasiadas solicitudes..." }
// Response 500: { error: "Error interno del servidor", requestId }
export const POST = withLogger(async (req, { requestId }) => {
  const ip = getClientIp(req);
  const rl = await applyRateLimit(waitlistLimiter, ip, requestId);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Probá en unos minutos." },
      { status: 429, headers: rl.headers }
    );
  }

  const body = await req.json();

  if (isHoneypotTriggered(body)) {
    logger.warn(requestId, "waitlist.honeypot_triggered");
    const fakeId = globalThis.crypto.randomUUID();
    return NextResponse.json(
      {
        data: {
          id: fakeId,
          email: typeof body === "object" && body && "email" in body ? body.email : "",
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201, headers: rl.headers }
    );
  }

  const parsed = waitlistSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn(requestId, "waitlist.invalid_input", {
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400, headers: rl.headers }
    );
  }

  try {
    const entry = await prisma.waitlistEntry.create({
      data: parsed.data,
      select: { id: true, email: true, createdAt: true },
    });

    logger.info(requestId, "waitlist.created", { entryId: entry.id });
    return NextResponse.json({ data: entry }, { status: 201, headers: rl.headers });
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
        { status: 409, headers: rl.headers }
      );
    }
    // Errores no manejados se propagan al wrapper, que loggea con stack y devuelve 500.
    throw error;
  }
});
