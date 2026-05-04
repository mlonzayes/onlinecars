import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";

// GET /api/leads
// Lista paginada de leads del concesionario autenticado.
// Query params:
//   page    (default 1)
//   limit   (default 20)
//   status  (opcional: "new" | "contacted" | "qualified" | "closed")
//   read    (opcional: "true" | "false" — "false" filtra status === "new")
//
// Response 200:
//   { data: Lead[], meta: { total, page, limit, totalPages, unreadCount } }
export const GET = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "leads.list.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "leads.list.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const statusParam = searchParams.get("status") ?? undefined;
  const readParam = searchParams.get("read") ?? undefined;

  // El filtro "read" tiene precedencia sobre "status":
  //   read=false → solo leads con status "new" (no leídos)
  //   read=true  → todos los que no son "new" (ya leídos)
  let statusFilter: string | undefined = statusParam;
  if (readParam === "false") {
    statusFilter = "new";
  } else if (readParam === "true") {
    statusFilter = undefined;
  }

  const baseWhere = {
    dealershipId: dealership.id,
    ...(readParam === "true" ? { NOT: { status: "new" } } : {}),
    ...(readParam !== "true" && statusFilter ? { status: statusFilter } : {}),
  };

  const [total, leads, unreadCount] = await Promise.all([
    prisma.lead.count({ where: baseWhere }),
    prisma.lead.findMany({
      where: baseWhere,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        vehicle: {
          select: { id: true, title: true, brand: true, model: true, year: true },
        },
      },
    }),
    prisma.lead.count({
      where: { dealershipId: dealership.id, status: "new" },
    }),
  ]);

  logger.info(requestId, "leads.list.ok", {
    dealershipId: dealership.id,
    total,
    page,
    limit,
    unreadCount,
  });

  return NextResponse.json({
    data: leads,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    },
  });
});
