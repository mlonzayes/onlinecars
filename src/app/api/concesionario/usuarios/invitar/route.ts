import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlanLimits } from "@/lib/plans";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";

export const POST = withLogger(async (_req, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "invite.create.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "invite.create.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  if (dealership.currentUser.role !== "admin") {
    logger.warn(requestId, "invite.create.forbidden", { userId });
    return NextResponse.json({ error: "Solo el dueño puede invitar usuarios" }, { status: 403 });
  }

  // Check limits
  const limits = getPlanLimits(dealership);
  
  const [usersCount, invitesCount] = await Promise.all([
    prisma.dealershipUser.count({ where: { dealershipId: dealership.id } }),
    prisma.dealershipInvite.count({ where: { dealershipId: dealership.id } }),
  ]);

  if (usersCount + invitesCount >= limits.maxUsers) {
    logger.warn(requestId, "invite.create.limit_reached", { dealershipId: dealership.id });
    return NextResponse.json({ error: "Límite de usuarios alcanzado para el plan actual" }, { status: 403 });
  }

  // Create invite
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Expira en 7 días

  const invite = await prisma.dealershipInvite.create({
    data: {
      dealershipId: dealership.id,
      role: "seller",
      token,
      expiresAt,
    },
  });

  logger.info(requestId, "invite.create.ok", { inviteId: invite.id });

  return NextResponse.json({ data: invite }, { status: 201 });
});
