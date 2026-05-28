import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";

type Params = { id: string };

export const DELETE = withLogger<Params>(async (_req, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "invite.delete.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  if (dealership.currentUser.role !== "admin") {
    return NextResponse.json({ error: "Solo el dueño puede cancelar invitaciones" }, { status: 403 });
  }

  try {
    await prisma.dealershipInvite.delete({
      where: { id: params.id, dealershipId: dealership.id },
    });
    logger.info(requestId, "invite.delete.ok", { inviteId: params.id });
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: "Error al eliminar la invitación" }, { status: 500 });
  }
});
