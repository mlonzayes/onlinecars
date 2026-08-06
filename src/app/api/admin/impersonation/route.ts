/**
 * Entrada y salida del modo plataforma (editar el sitio de un cliente).
 *
 * POST   /api/admin/impersonation  { "dealershipId": "cmx..." } → setea la cookie
 * DELETE /api/admin/impersonation                               → la borra
 *
 * La cookie solo indica el TARGET. La autorización se re-verifica en cada
 * request desde resolveSiteBuilderContext — ver src/lib/admin-context.ts.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { isSuperAdmin } from "@/lib/super-admin";
import { PLATFORM_EDIT_COOKIE, PLATFORM_EDIT_MAX_AGE } from "@/lib/admin-context";

const startSchema = z.object({ dealershipId: z.string().min(1) }).strict();

export const POST = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId || !isSuperAdmin(userId)) {
    logger.warn(requestId, "admin.impersonation.forbidden", { userId });
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body: unknown = await request.json();
  const parsed = startSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Verificamos que exista ANTES de setear la cookie: si no, el editor abre
  // sobre una cuenta fantasma y el error aparece recién dos pantallas después.
  const target = await prisma.dealership.findUnique({
    where: { id: parsed.data.dealershipId },
    select: { id: true, name: true, slug: true },
  });
  if (!target) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }

  (await cookies()).set(PLATFORM_EDIT_COOKIE, target.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PLATFORM_EDIT_MAX_AGE,
  });

  logger.info(requestId, "admin.impersonation.started", {
    actingSuperAdmin: userId,
    dealershipId: target.id,
    slug: target.slug,
  });

  return NextResponse.json({ data: { id: target.id, name: target.name } });
});

export const DELETE = withLogger(async (_request, { requestId }) => {
  const { userId } = await auth();
  // Salir NO exige ser super-admin: si por lo que sea quedó una cookie colgada
  // en la sesión de alguien, tiene que poder limpiarla. Borrar nunca hace daño.
  (await cookies()).delete(PLATFORM_EDIT_COOKIE);

  logger.info(requestId, "admin.impersonation.stopped", { userId });

  return NextResponse.json({ data: { ok: true } });
});
