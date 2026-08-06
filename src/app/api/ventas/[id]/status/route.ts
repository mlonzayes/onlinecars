import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saleStatusSchema } from "@/lib/validators/sale";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";

type SaleParams = { id: string };

// Labels en español para el texto de la notificación.
const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  reserved: "Reservada",
  in_progress: "En curso",
  completed: "Completada",
  cancelled: "Cancelada",
};

// Flujo de estados válido:
// draft → reserved → in_progress → completed
// Cualquier estado → cancelled
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["reserved", "cancelled"],
  reserved: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

// PATCH /api/ventas/[id]/status
// Avanza o cancela una venta. Maneja side-effects sobre el vehículo en una transacción.
export const PATCH = withLogger<SaleParams>(async (request, { requestId, params }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "sales.status.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "sales.status.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const { id } = params;
  const body: unknown = await request.json();
  const parsed = saleStatusSchema.safeParse(body);

  if (!parsed.success) {
    logger.warn(requestId, "sales.status.invalid_input", {
      dealershipId: dealership.id,
      saleId: id,
      details: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const sale = await prisma.sale.findFirst({
    where: { id, dealershipId: dealership.id },
    select: { id: true, status: true, vehicleId: true, unlimitedStock: true },
  });

  if (!sale) {
    logger.warn(requestId, "sales.status.not_found", {
      dealershipId: dealership.id,
      saleId: id,
    });
    return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
  }

  const nextStatus = parsed.data.status;
  const allowed = VALID_TRANSITIONS[sale.status] ?? [];

  if (!allowed.includes(nextStatus)) {
    logger.warn(requestId, "sales.status.invalid_transition", {
      dealershipId: dealership.id,
      saleId: id,
      from: sale.status,
      to: nextStatus,
    });
    return NextResponse.json(
      {
        error: `No se puede pasar de "${sale.status}" a "${nextStatus}"`,
      },
      { status: 422 }
    );
  }

  // Determinar el nuevo status del vehículo según la transición.
  let vehicleStatus: "available" | "reserved" | "sold" | null = null;
  if (nextStatus === "completed") {
    vehicleStatus = "sold";
  } else if (nextStatus === "cancelled") {
    vehicleStatus = "available";
  }

  const updateData: Record<string, unknown> = { status: nextStatus };
  if (nextStatus === "cancelled" && "cancelReason" in parsed.data) {
    updateData.cancelReason = parsed.data.cancelReason;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedSale = await tx.sale.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, businessName: true },
        },
        vehicle: { select: { id: true, title: true, status: true } },
      },
    });

    // Los ilimitados (0km) NUNCA sincronizan el status del vehículo: la
    // publicación queda disponible/publicada aunque la venta se complete.
    if (vehicleStatus !== null && !sale.unlimitedStock) {
      // Al completar la venta, además de marcar el vehículo como "sold",
      // lo despublicamos automáticamente. Razones:
      //  1) Los vendidos no deberían aparecer en el catálogo público
      //  2) Liberan el slot del plan (el límite se cuenta por publicados)
      // El user puede volver a publicarlo manualmente si quiere mostrarlo
      // como "ya vendido" en la web.
      const vehicleUpdate: Record<string, unknown> = { status: vehicleStatus };
      if (nextStatus === "completed") {
        vehicleUpdate.publishedAt = null;
      }
      await tx.vehicle.update({
        where: { id: sale.vehicleId },
        data: vehicleUpdate,
      });
    }

    return updatedSale;
  });

  // Invalidar el cache del tenant si el vehículo cambió de visibilidad pública.
  // Los ilimitados no cambian de status/publicación, así que no hace falta.
  if (nextStatus === "completed" && !sale.unlimitedStock) {
    const { invalidateTenantHomeBundle } = await import("@/lib/tenant");
    await invalidateTenantHomeBundle(dealership.slug);
  }

  // Una transición de status cambia los counters de los stats (un draft pasa
  // a reserved → baja "draft" sube "reserved", etc). Y como la transición
  // sincroniza el status del VEHÍCULO, también quedan viejos los stats del
  // listado de stock. El bundle del tenant, en cambio, solo se invalida arriba
  // cuando cambia la visibilidad pública — por eso no se agrupan.
  revalidateTag(CACHE_TAGS.salesStats);
  revalidateTag(CACHE_TAGS.vehiclesStats);

  logger.info(requestId, "sales.status.ok", {
    dealershipId: dealership.id,
    saleId: id,
    from: sale.status,
    to: nextStatus,
  });

  // Notificación in-app del cambio de estado.
  const customerName =
    updated.customer.businessName ||
    [updated.customer.firstName, updated.customer.lastName].filter(Boolean).join(" ") ||
    "Cliente";
  await createNotification({
    dealershipId: dealership.id,
    type: "sale",
    title: `Venta ${STATUS_LABELS[nextStatus] ?? nextStatus}`,
    body: `${customerName} · ${updated.vehicle.title}`,
    link: `/dashboard/ventas/${id}`,
    requestId,
  });

  return NextResponse.json({ data: updated });
});
