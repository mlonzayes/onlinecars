import { prisma } from "@/lib/prisma";
import { generateVehicleSlug } from "@/lib/utils/slug";
import type { VehicleImportRow } from "@/lib/validators/vehicle-import";

/**
 * Genera un publicSlug libre para cada fila del lote.
 *
 * El alta individual reintenta ante colisión atrapando el P2002 de Prisma, algo
 * que no sirve en un `createMany`. Acá invertimos el enfoque: se generan todos
 * los slugs, se consultan de una sola vez los que ya existan y se regeneran solo
 * los que hayan chocado.
 *
 * Las filas que no consigan slug en `MAX_ROUNDS` quedan fuera del Map y el
 * handler las reporta como omitidas. Con 4 bytes de entropía por slug, eso es
 * prácticamente imposible.
 */
export async function assignPublicSlugs(
  dealershipId: string,
  rows: VehicleImportRow[]
): Promise<Map<number, string>> {
  const MAX_ROUNDS = 3;
  const assigned = new Map<number, string>();
  const used = new Set<string>();
  let pending = rows;

  for (let round = 0; round < MAX_ROUNDS && pending.length > 0; round++) {
    const candidates = new Map<number, string>();
    for (const row of pending) {
      let slug = generateVehicleSlug(row.vehicle.brand, row.vehicle.model, row.vehicle.year);
      // Colisión dentro del mismo lote: regeneramos sin ir a la DB.
      while (used.has(slug)) {
        slug = generateVehicleSlug(row.vehicle.brand, row.vehicle.model, row.vehicle.year);
      }
      used.add(slug);
      candidates.set(row.rowNumber, slug);
    }

    const taken = await prisma.vehicle.findMany({
      where: { dealershipId, publicSlug: { in: [...candidates.values()] } },
      select: { publicSlug: true },
    });
    const takenSet = new Set(taken.map((v) => v.publicSlug));

    const stillPending: VehicleImportRow[] = [];
    for (const row of pending) {
      const slug = candidates.get(row.rowNumber)!;
      if (takenSet.has(slug)) {
        used.delete(slug);
        stillPending.push(row);
      } else {
        assigned.set(row.rowNumber, slug);
      }
    }
    pending = stillPending;
  }

  return assigned;
}
