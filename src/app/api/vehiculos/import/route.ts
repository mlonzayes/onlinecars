import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getCurrentDealership } from "@/lib/auth";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { canEditCosts } from "@/lib/permissions";
import { invalidateVehicleCaches } from "@/lib/cache-tags";
import {
  vehicleImportSchema,
  vehicleImportRowSchema,
  type ImportResult,
  type SkippedRow,
  type VehicleImportRow,
} from "@/lib/validators/vehicle-import";
import {
  dedupeImportRows,
  insertVehiclesInChunks,
  rowLabel,
} from "@/lib/import/vehicle-import-service";
import { assignPublicSlugs } from "@/lib/import/vehicle-import-slugs";

// POST /api/vehiculos/import
//
// Importación masiva de vehículos desde una planilla parseada en el cliente.
// El archivo NUNCA llega acá: el browser lo lee y manda JSON ya estructurado.
//
// Request:  { rows: [{ rowNumber: 2, vehicle: { title, brand, model, year, price, ... } }] }
// Response: { data: { imported: 12, skipped: [{ rowNumber: 5, reason: "duplicate", message: "..." }] } }
//
// Los vehículos entran SIEMPRE como borrador (publishedAt = null): no consumen
// el límite del plan y le dan al dealer la chance de revisar antes de publicar.
export const POST = withLogger(async (request, { requestId }) => {
  const { userId } = await auth();
  if (!userId) {
    logger.warn(requestId, "vehicles.import.unauthorized");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dealership = await getCurrentDealership();
  if (!dealership) {
    logger.warn(requestId, "vehicles.import.no_dealership", { userId });
    return NextResponse.json({ error: "Concesionario no encontrado" }, { status: 404 });
  }

  const body: unknown = await request.json();
  const envelope = vehicleImportSchema.safeParse(body);
  if (!envelope.success) {
    logger.warn(requestId, "vehicles.import.invalid_payload", {
      dealershipId: dealership.id,
      details: envelope.error.flatten(),
    });
    return NextResponse.json(
      { error: "Datos inválidos", details: envelope.error.flatten() },
      { status: 400 }
    );
  }

  // Los costos solo los carga un admin. Mismo criterio que el alta individual:
  // si no tiene permiso se descartan en silencio, no es un error de la fila.
  const allowedToEditCosts = canEditCosts(dealership.currentUser);

  // Validación fila por fila: una fila rota se reporta como omitida en vez de
  // tumbar la importación completa.
  const valid: VehicleImportRow[] = [];
  const skipped: SkippedRow[] = [];

  envelope.data.rows.forEach((raw, index) => {
    const candidate = raw as { rowNumber?: number; vehicle?: Record<string, unknown> };
    // Si la celda de moneda vino vacía, hereda la del concesionario en vez de
    // caer en el "ARS" por defecto del schema — el producto ya es multi-país.
    if (candidate?.vehicle && candidate.vehicle.currency === undefined) {
      candidate.vehicle.currency = dealership.currency;
    }

    const parsed = vehicleImportRowSchema.safeParse(candidate);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      skipped.push({
        rowNumber: candidate?.rowNumber ?? index + 1,
        reason: "invalid",
        message: firstIssue
          ? `${firstIssue.path.join(".") || "fila"}: ${firstIssue.message}`
          : "Datos inválidos",
      });
      return;
    }
    valid.push(parsed.data);
  });

  const { kept, skipped: duplicates } = await dedupeImportRows(dealership.id, valid);
  skipped.push(...duplicates);

  if (kept.length === 0) {
    logger.info(requestId, "vehicles.import.nothing_to_import", {
      dealershipId: dealership.id,
      skipped: skipped.length,
    });
    const empty: ImportResult = { imported: 0, skipped };
    return NextResponse.json({ data: empty }, { status: 200 });
  }

  const slugs = await assignPublicSlugs(dealership.id, kept);

  const records: { rowNumber: number; label: string; data: Prisma.VehicleCreateManyInput }[] = [];
  for (const row of kept) {
    const publicSlug = slugs.get(row.rowNumber);
    if (!publicSlug) {
      // Agotó los reintentos de slug. Con 4 bytes de entropía es casi imposible,
      // pero preferimos reportarlo antes que insertar algo inconsistente.
      skipped.push({
        rowNumber: row.rowNumber,
        reason: "error",
        message: "No se pudo generar un identificador único. Probá de nuevo.",
        label: rowLabel(row),
      });
      continue;
    }

    const { costPrice, costCurrency, ...rest } = row.vehicle;
    records.push({
      rowNumber: row.rowNumber,
      label: rowLabel(row),
      data: {
        ...rest,
        ...(allowedToEditCosts
          ? { costPrice: costPrice ?? null, costCurrency: costCurrency ?? null }
          : {}),
        dealershipId: dealership.id,
        publicSlug,
        // Borrador explícito: no consume el cupo de publicados del plan.
        publishedAt: null,
      },
    });
  }

  const { imported, skipped: failed } = await insertVehiclesInChunks(
    requestId,
    dealership.id,
    records
  );
  skipped.push(...failed);

  if (imported > 0) {
    await invalidateVehicleCaches(dealership.slug);
  }

  logger.info(requestId, "vehicles.import.ok", {
    dealershipId: dealership.id,
    received: envelope.data.rows.length,
    imported,
    skipped: skipped.length,
  });

  const result: ImportResult = {
    imported,
    skipped: skipped.sort((a, b) => a.rowNumber - b.rowNumber),
  };
  return NextResponse.json({ data: result }, { status: 200 });
});
