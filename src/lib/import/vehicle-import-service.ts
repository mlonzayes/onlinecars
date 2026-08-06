import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { IMPORT_CHUNK_SIZE } from "./import-config";
import type { SkippedRow, VehicleImportRow } from "@/lib/validators/vehicle-import";

/** Identificador legible de una fila, para que el dealer la ubique en su Excel. */
export function rowLabel(row: VehicleImportRow): string {
  const { brand, model, year } = row.vehicle;
  return `${brand} ${model} ${year}`;
}

interface DedupResult {
  kept: VehicleImportRow[];
  skipped: SkippedRow[];
}

/**
 * Descarta filas cuyo VIN o patente ya existan — dentro del propio lote o en el
 * catálogo del concesionario.
 *
 * OJO: la DB no tiene unique en `vin` ni en `licensePlate` (solo en
 * `[dealershipId, publicSlug]`), así que Postgres NO nos cubre. Esta dedup es
 * la única defensa contra cargar dos veces el mismo auto.
 */
export async function dedupeImportRows(
  dealershipId: string,
  rows: VehicleImportRow[]
): Promise<DedupResult> {
  const vins = rows.map((r) => r.vehicle.vin?.trim()).filter((v): v is string => !!v);
  const plates = rows
    .map((r) => r.vehicle.licensePlate?.trim())
    .filter((v): v is string => !!v);

  const existing =
    vins.length || plates.length
      ? await prisma.vehicle.findMany({
          where: {
            dealershipId,
            OR: [
              ...(vins.length ? [{ vin: { in: vins, mode: "insensitive" as const } }] : []),
              ...(plates.length
                ? [{ licensePlate: { in: plates, mode: "insensitive" as const } }]
                : []),
            ],
          },
          select: { vin: true, licensePlate: true },
        })
      : [];

  const takenVins = new Set(existing.map((v) => v.vin?.toLowerCase()).filter(Boolean));
  const takenPlates = new Set(
    existing.map((v) => v.licensePlate?.toLowerCase()).filter(Boolean)
  );

  const kept: VehicleImportRow[] = [];
  const skipped: SkippedRow[] = [];

  for (const row of rows) {
    const vin = row.vehicle.vin?.trim().toLowerCase();
    const plate = row.vehicle.licensePlate?.trim().toLowerCase();

    if (vin && takenVins.has(vin)) {
      skipped.push({
        rowNumber: row.rowNumber,
        reason: "duplicate",
        message: `El VIN ${row.vehicle.vin} ya está cargado en tu catálogo`,
        label: rowLabel(row),
      });
      continue;
    }
    if (plate && takenPlates.has(plate)) {
      skipped.push({
        rowNumber: row.rowNumber,
        reason: "duplicate",
        message: `La patente ${row.vehicle.licensePlate} ya está cargada en tu catálogo`,
        label: rowLabel(row),
      });
      continue;
    }

    // Reservamos los identificadores de esta fila para detectar repetidos
    // dentro del mismo archivo, no solo contra lo que ya está en la DB.
    if (vin) takenVins.add(vin);
    if (plate) takenPlates.add(plate);
    kept.push(row);
  }

  return { kept, skipped };
}

/** Traduce un error de Prisma a algo que el dealer pueda entender y accionar. */
export function toReadableError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? (error.meta.target as string[]).join(", ")
        : "un dato único";
      return `Ya existe un vehículo con el mismo valor en: ${target}`;
    }
    if (error.code === "P2000") return "Un campo supera el largo máximo permitido";
  }
  return "No se pudo guardar este vehículo";
}

type VehicleCreateData = Prisma.VehicleCreateManyInput;

/**
 * Inserta en chunks. Si un chunk falla, se reintenta fila por fila para aislar
 * a la culpable y salvar al resto — el requisito es importar todo lo posible y
 * reportar lo que quedó afuera, nunca abortar el lote entero.
 */
export async function insertVehiclesInChunks(
  requestId: string,
  dealershipId: string,
  records: { rowNumber: number; label: string; data: VehicleCreateData }[]
): Promise<{ imported: number; skipped: SkippedRow[] }> {
  const skipped: SkippedRow[] = [];
  let imported = 0;

  for (let i = 0; i < records.length; i += IMPORT_CHUNK_SIZE) {
    const chunk = records.slice(i, i + IMPORT_CHUNK_SIZE);
    try {
      const result = await prisma.vehicle.createMany({ data: chunk.map((r) => r.data) });
      imported += result.count;
    } catch {
      logger.warn(requestId, "vehicles.import.chunk_failed", {
        dealershipId,
        chunkStart: i,
        chunkSize: chunk.length,
      });

      for (const record of chunk) {
        try {
          await prisma.vehicle.create({ data: record.data });
          imported++;
        } catch (rowError) {
          skipped.push({
            rowNumber: record.rowNumber,
            reason: "error",
            message: toReadableError(rowError),
            label: record.label,
          });
        }
      }
    }
  }

  return { imported, skipped };
}
