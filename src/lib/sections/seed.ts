import type { Prisma } from "@prisma/client";
import { SECTION_TYPES, type SectionType } from "../constants";
import {
  DEFAULT_SECTION_COPY,
  DEFAULT_SECTION_CONFIG,
  DEFAULT_SECTION_ORDER,
} from "../tenant-defaults";

interface LegacyHero {
  heroType?: string | null;
  heroUrl?: string | null;
}

// Secciones que arrancan deshabilitadas hasta que el dealer suba contenido
// y las active manualmente. Evita placeholders "Próximamente" visibles por default.
const DISABLED_BY_DEFAULT = new Set<SectionType>(["gallery", "about", "financing"]);

export interface SeedResult {
  /** True si esta llamada sembró desde cero (no había NINGUNA sección antes). */
  seeded: boolean;
  /** Cantidad de secciones que se agregaron como "faltantes" (parcial seed). */
  addedMissing: number;
  /** True si además se migró el hero legacy del theme. */
  migratedHero: boolean;
}

/**
 * Asegura que el dealership tenga TODAS las secciones definidas en SECTION_TYPES.
 *
 * Tres escenarios que cubre:
 *   A) Dealership nuevo (0 secciones)         → siembra las 8 + migra hero legacy si aplica
 *   B) Dealership viejo con tipos faltantes   → agrega solo los que faltan (ej: "categories")
 *   C) Dealership al día (todas las secciones) → no-op
 *
 * Idempotente y safe: usar @@unique([dealershipId, type]) como red de seguridad
 * ante race conditions (si dos requests entran simultáneamente).
 *
 * - Atómica: corre dentro del Prisma TransactionClient que reciba.
 * - El caller decide loggear y maneja la transacción.
 */
export async function seedDefaultSections(
  tx: Prisma.TransactionClient,
  dealershipId: string,
  legacyTheme?: LegacyHero | null
): Promise<SeedResult> {
  const existingRows = await tx.dealershipSection.findMany({
    where: { dealershipId },
    select: { type: true, order: true },
  });
  const existingTypes = new Set(existingRows.map((r) => r.type));
  const isFreshSeed = existingRows.length === 0;

  const missingTypes = SECTION_TYPES.filter((t) => !existingTypes.has(t));
  if (missingTypes.length === 0) {
    return { seeded: false, addedMissing: 0, migratedHero: false };
  }

  // Para escenario B (parcial seed): los faltantes se agregan al FINAL del orden
  // actual, no en su DEFAULT_SECTION_ORDER. Eso preserva el orden manual del
  // dealer y evita pisar lo que ya configuró. Si quiere ponerlos arriba, los mueve.
  const maxOrder = existingRows.reduce((max, r) => Math.max(max, r.order), 0);

  await tx.dealershipSection.createMany({
    data: missingTypes.map((type, idx) => {
      const copy = DEFAULT_SECTION_COPY[type];
      const order = isFreshSeed
        ? DEFAULT_SECTION_ORDER[type]
        : maxOrder + 1 + idx;
      return {
        dealershipId,
        type,
        enabled: !DISABLED_BY_DEFAULT.has(type),
        order,
        title: copy.title,
        subtitle: copy.subtitle,
        content: copy.content,
        // Cast vía unknown porque los tipos de config son interfaces estrictas y
        // Prisma.InputJsonValue requiere index signature. El shape es serializable.
        config: DEFAULT_SECTION_CONFIG[type] as unknown as Prisma.InputJsonValue,
      };
    }),
    skipDuplicates: true, // red de seguridad ante races
  });

  // 2. Migración del hero legacy desde theme.heroUrl si aplica.
  // Solo corre en escenario A (fresh seed) — no queremos sobreescribir media
  // que el dealer ya pueda haber subido manualmente.
  let migratedHero = false;
  const heroUrl = legacyTheme?.heroUrl?.trim();
  const heroType = legacyTheme?.heroType?.trim();
  if (isFreshSeed && heroUrl && (heroType === "image" || heroType === "video")) {
    const purpose = heroType === "video" ? "hero_video" : "hero_image";
    const mimeType = heroType === "video" ? "video/mp4" : "image/jpeg";

    await tx.dealershipMedia.create({
      data: {
        dealershipId,
        sectionType: "hero",
        purpose,
        url: heroUrl,
        // key sintética — el asset legacy nunca pasó por nuestro storage abstraction
        // (vino de una URL externa pegada en un input). Cuando el dealer suba un hero
        // nuevo, el media.upload.singleton_replaced va a intentar storage.delete sobre
        // esta key y va a fallar silenciosamente, lo cual está OK.
        key: `legacy:${dealershipId}:${purpose}`,
        mimeType,
        sizeBytes: 0, // dato legacy desconocido
        order: 0,
      },
    });
    migratedHero = true;
  }

  return {
    seeded: isFreshSeed,
    addedMissing: isFreshSeed ? 0 : missingTypes.length,
    migratedHero,
  };
}
