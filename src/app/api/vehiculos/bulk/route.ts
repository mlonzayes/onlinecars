/**
 * POST /api/vehiculos/bulk
 *
 * Operaciones masivas sobre vehiculos. Body shape:
 *   { action: "delete",   ids: [...] }
 *   { action: "status",   ids: [...], status: "available" | "reserved" | "sold" }
 *   { action: "publish",  ids: [...], value: boolean }
 *   { action: "featured", ids: [...], value: boolean }
 *
 * Garantías:
 *   - Multi-tenancy: filtra por dealershipId antes de tocar nada
 *   - Límite: máx BULK_MAX_ITEMS (50) ids por request — Zod lo enforza
 *   - Plan gating: requiere allowBulkActions (defense in depth con la UI)
 *   - Best-effort en delete: los vehículos con venta activa se reportan como
 *     "blocked" pero NO abortan la operación sobre los demás
 *
 * Response shape:
 *   { ok: number, blocked?: BlockedItem[], failed?: FailedItem[] }
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { vehicleBulkSchema } from "@/lib/validators/vehicle-bulk";
import { BLOCKING_SALE_STATUSES } from "@/lib/sale-guards";
import { getPlanLimits, canPublishMoreVehicles } from "@/lib/plans";
import { invalidateTenantHomeBundle } from "@/lib/tenant";
import { Prisma, type Dealership } from "@prisma/client";

// Mapea constraints conocidas a labels legibles para el user. Cuando aparezca
// una FK violation en delete, queremos decirle "tiene venta asociada" en vez
// del nombre técnico del constraint. Si hay un constraint nuevo no mapeado,
// usamos un fallback genérico.
const FK_CONSTRAINT_LABELS: Record<string, string> = {
  sales_vehicleId_fkey: "tiene una venta asociada",
  // Otros constraints (vehicle_images, ml_listings, quotations) están en
  // Cascade o SetNull — no deberían disparar FK violation.
};

interface BlockedItem {
  id: string;
  title: string;
  reason: string;
}

const BLOCKING_LABEL: Record<string, string> = {
  reserved: "venta reservada",
  in_progress: "venta en curso",
  completed: "venta completada",
};

export const POST = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  // Plan gating server-side. La UI ya valida, pero acá es defense in depth.
  const limits = getPlanLimits(dealership);
  if (!limits.allowBulkActions) {
    logger.warn(requestId, "vehicles.bulk.plan_gated", {
      dealershipId: dealership.id,
      plan: dealership.plan,
    });
    return NextResponse.json(
      { error: "Las acciones masivas requieren el plan Media o superior." },
      { status: 403 }
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = vehicleBulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const uniqueIds = Array.from(new Set(input.ids));

  // Multi-tenancy: pedimos solo los vehiculos del dealership Y que estén
  // en el set de IDs. Si el cliente mandó IDs de otro tenant, no aparecen.
  const owned = await prisma.vehicle.findMany({
    where: { id: { in: uniqueIds }, dealershipId: dealership.id },
    select: { id: true, title: true },
  });

  if (owned.length === 0) {
    return NextResponse.json(
      { error: "Ninguno de los vehículos pertenece a este concesionario." },
      { status: 404 }
    );
  }

  const ownedIds = owned.map((v) => v.id);

  switch (input.action) {
    case "delete":
      return handleBulkDelete(requestId, dealership.id, dealership.slug, owned, ownedIds);
    case "status":
      return handleBulkStatus(requestId, dealership.id, dealership.slug, ownedIds, input.status);
    case "publish":
      return handleBulkPublish(requestId, dealership, ownedIds, input.value);
    case "featured":
      return handleBulkFeatured(requestId, dealership.id, dealership.slug, ownedIds, input.value);
  }
});

// ─── Acción: delete ───────────────────────────────────────────────────────────

async function handleBulkDelete(
  requestId: string,
  dealershipId: string,
  dealershipSlug: string,
  owned: Array<{ id: string; title: string }>,
  ownedIds: string[]
) {
  // Una sola query para detectar todas las ventas que bloquean — evita N+1.
  const blockingSales = await prisma.sale.findMany({
    where: {
      vehicleId: { in: ownedIds },
      dealershipId,
      status: { in: [...BLOCKING_SALE_STATUSES] },
    },
    select: { vehicleId: true, status: true },
  });

  const blockedMap = new Map<string, string>();
  for (const s of blockingSales) {
    blockedMap.set(s.vehicleId, BLOCKING_LABEL[s.status] ?? s.status);
  }

  const blocked: BlockedItem[] = [];
  const deletableIds: string[] = [];
  for (const v of owned) {
    const reason = blockedMap.get(v.id);
    if (reason) blocked.push({ id: v.id, title: v.title, reason });
    else deletableIds.push(v.id);
  }

  let deleted = 0;
  if (deletableIds.length > 0) {
    try {
      const result = await prisma.vehicle.deleteMany({
        where: { id: { in: deletableIds }, dealershipId },
      });
      deleted = result.count;
      await invalidateTenantHomeBundle(dealershipSlug);
    } catch (err) {
      // FK violation: hay otra tabla apuntando al vehículo sin Cascade/SetNull.
      // El sale-guard de arriba ya cubre las ventas activas, así que esto solo
      // dispara si aparece una FK nueva que no manejamos. Devolvemos mensaje
      // legible con el constraint para diagnóstico futuro.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
        const constraint = String(err.meta?.constraint ?? "desconocida");
        const reason = FK_CONSTRAINT_LABELS[constraint] ?? `relación protegida (${constraint})`;
        logger.warn(requestId, "vehicles.bulk.delete.fk_violation", {
          dealershipId,
          constraint,
          ids: deletableIds,
        });
        // Marcamos los que iban a borrarse como bloqueados con la razón real
        for (const v of owned) {
          if (deletableIds.includes(v.id)) {
            blocked.push({ id: v.id, title: v.title, reason });
          }
        }
        return NextResponse.json({ ok: 0, blocked });
      }
      throw err;
    }
  }

  logger.info(requestId, "vehicles.bulk.delete.ok", {
    dealershipId,
    requested: owned.length,
    deleted,
    blocked: blocked.length,
  });

  return NextResponse.json({ ok: deleted, blocked });
}

// ─── Acción: status ───────────────────────────────────────────────────────────

async function handleBulkStatus(
  requestId: string,
  dealershipId: string,
  dealershipSlug: string,
  ownedIds: string[],
  newStatus: string
) {
  const result = await prisma.vehicle.updateMany({
    where: { id: { in: ownedIds }, dealershipId },
    data: { status: newStatus },
  });

  await invalidateTenantHomeBundle(dealershipSlug);

  logger.info(requestId, "vehicles.bulk.status.ok", {
    dealershipId,
    count: result.count,
    newStatus,
  });

  return NextResponse.json({ ok: result.count });
}

// ─── Acción: publish ──────────────────────────────────────────────────────────

async function handleBulkPublish(
  requestId: string,
  dealership: Pick<Dealership, "id" | "slug" | "plan">,
  ownedIds: string[],
  value: boolean
) {
  // Despublicar: nunca bloquea por límite (siempre baja el contador).
  if (!value) {
    const result = await prisma.vehicle.updateMany({
      where: { id: { in: ownedIds }, dealershipId: dealership.id },
      data: { publishedAt: null },
    });
    await invalidateTenantHomeBundle(dealership.slug);
    logger.info(requestId, "vehicles.bulk.publish.ok", {
      dealershipId: dealership.id,
      count: result.count,
      value: false,
    });
    return NextResponse.json({ ok: result.count });
  }

  // Publicar: chequear cuántos slots quedan disponibles según el plan.
  // Solo cuentan los IDs que están ACTUALMENTE despublicados (los ya publicados
  // no consumen un slot nuevo).
  const toPublish = await prisma.vehicle.findMany({
    where: { id: { in: ownedIds }, dealershipId: dealership.id, publishedAt: null },
    select: { id: true, title: true },
  });

  if (toPublish.length === 0) {
    return NextResponse.json({ ok: 0 });
  }

  const limit = getPlanLimits(dealership).maxVehicles;
  const currentPublished = await prisma.vehicle.count({
    where: { dealershipId: dealership.id, publishedAt: { not: null } },
  });
  const slotsAvailable = Math.max(0, limit - currentPublished);

  const willPublish = toPublish.slice(0, slotsAvailable);
  const blocked = toPublish.slice(slotsAvailable).map((v) => ({
    id: v.id,
    title: v.title,
    reason: `límite del plan (${limit} publicados)`,
  }));

  let published = 0;
  if (willPublish.length > 0) {
    const result = await prisma.vehicle.updateMany({
      where: { id: { in: willPublish.map((v) => v.id) }, dealershipId: dealership.id },
      data: { publishedAt: new Date() },
    });
    published = result.count;
    await invalidateTenantHomeBundle(dealership.slug);
  }

  logger.info(requestId, "vehicles.bulk.publish.ok", {
    dealershipId: dealership.id,
    requested: toPublish.length,
    published,
    blocked: blocked.length,
    value: true,
  });

  return NextResponse.json({ ok: published, blocked: blocked.length > 0 ? blocked : undefined });
}

// ─── Acción: featured ─────────────────────────────────────────────────────────

async function handleBulkFeatured(
  requestId: string,
  dealershipId: string,
  dealershipSlug: string,
  ownedIds: string[],
  value: boolean
) {
  const result = await prisma.vehicle.updateMany({
    where: { id: { in: ownedIds }, dealershipId },
    data: { featured: value },
  });

  await invalidateTenantHomeBundle(dealershipSlug);

  logger.info(requestId, "vehicles.bulk.featured.ok", {
    dealershipId,
    count: result.count,
    value,
  });

  return NextResponse.json({ ok: result.count });
}
