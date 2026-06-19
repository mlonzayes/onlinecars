/**
 * PATCH /api/admin/dealerships/[id]  → super-admin actualiza plan o estado de una cuenta.
 *
 * Cross-tenant: solo super-admin (isSuperAdmin). NO filtra por dealershipId — el
 * super-admin opera sobre cualquier cuenta; el guard es la única protección.
 *
 * PATCH request:  { "plan": "premium" }  ó  { "subscriptionStatus": "suspended" }
 * PATCH response: { "data": { "id": "cmx...", "plan": "premium", "subscriptionStatus": "active" } }
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { isSuperAdmin } from "@/lib/super-admin";
import { adminDealershipUpdateSchema } from "@/lib/validators/admin";

type RouteParams = { id: string };

export const PATCH = withLogger<RouteParams>(async (request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId || !isSuperAdmin(userId)) {
    logger.warn(requestId, "admin.dealership.update.forbidden", { userId });
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body: unknown = await request.json();
  const parsed = adminDealershipUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.dealership.update({
      where: { id: params.id },
      data: parsed.data,
      select: { id: true, plan: true, subscriptionStatus: true },
    });

    logger.info(requestId, "admin.dealership.update.ok", {
      dealershipId: updated.id,
      changes: parsed.data,
    });

    return NextResponse.json({ data: updated });
  } catch (error: unknown) {
    // P2025 = registro no encontrado.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }
    throw error;
  }
});
