/**
 * POST /api/admin/waitlist/[id]/invite
 *
 * Aprueba un lead del waitlist y genera un invite token + URL.
 * Solo super-admins (lista en SUPER_ADMIN_CLERK_USER_IDS).
 *
 * El token vive 7 días. Si el lead no completa el registro en ese plazo,
 * el admin tiene que regenerar el invite (otro POST a este endpoint).
 *
 * Idempotencia: si el lead ya tiene un token activo, lo devuelve. Si está
 * acceptado, devuelve 409. Si fue rechazado, devuelve 409.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { randomBytes } from "crypto";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/super-admin";

type Params = { id: string };

// Vencimiento del token: 7 días desde que se genera.
const INVITE_TTL_DAYS = 7;

function buildInviteUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `${base}/registro?token=${token}`;
}

export const POST = withLogger<Params>(async (_request, { requestId, params }) => {
  const { userId } = await auth();
  if (!isSuperAdmin(userId)) {
    logger.warn(requestId, "admin.waitlist.invite.forbidden", { userId });
    return NextResponse.json({ error: "Acceso restringido" }, { status: 403 });
  }

  const { id } = params;

  const lead = await prisma.waitlistEntry.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
  }

  if (lead.status === "accepted") {
    return NextResponse.json(
      { error: "Este lead ya completó el registro" },
      { status: 409 }
    );
  }
  if (lead.status === "rejected") {
    return NextResponse.json(
      { error: "Este lead fue rechazado. No se puede invitar." },
      { status: 409 }
    );
  }

  // Si ya tiene un token vigente, lo devolvemos en vez de generar uno nuevo.
  // Así si el admin clickea "Aprobar" dos veces, el link no cambia.
  if (
    lead.status === "invited" &&
    lead.inviteToken &&
    lead.inviteExpiresAt &&
    lead.inviteExpiresAt > new Date()
  ) {
    logger.info(requestId, "admin.waitlist.invite.reused", {
      leadId: id,
      adminUserId: userId,
    });
    return NextResponse.json({
      token: lead.inviteToken,
      url: buildInviteUrl(lead.inviteToken),
      expiresAt: lead.inviteExpiresAt.toISOString(),
      reused: true,
    });
  }

  // Token opaco de 32 bytes hex (64 chars). No es predecible.
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + INVITE_TTL_DAYS);

  const updated = await prisma.waitlistEntry.update({
    where: { id },
    data: {
      status: "invited",
      inviteToken: token,
      invitedAt: now,
      inviteExpiresAt: expiresAt,
    },
  });

  logger.info(requestId, "admin.waitlist.invite.created", {
    leadId: id,
    adminUserId: userId,
    expiresAt: expiresAt.toISOString(),
  });

  return NextResponse.json({
    token: updated.inviteToken,
    url: buildInviteUrl(token),
    expiresAt: expiresAt.toISOString(),
    reused: false,
  });
});
