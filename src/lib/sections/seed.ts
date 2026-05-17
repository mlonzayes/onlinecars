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
  /** True si esta llamada efectivamente sembró las secciones (count === 0 al entrar). */
  seeded: boolean;
  /** True si además se migró el hero legacy del theme. */
  migratedHero: boolean;
}

/**
 * Siembra las 7 secciones default para un dealership cuando no existe ninguna.
 * Si el dealership tenía un hero legacy en theme.heroUrl, lo migra a DealershipMedia.
 *
 * - Idempotente: si ya hay secciones, no hace nada.
 * - Atómica: corre dentro del Prisma TransactionClient que reciba.
 * - El caller decide loggear y maneja la transacción.
 */
export async function seedDefaultSections(
  tx: Prisma.TransactionClient,
  dealershipId: string,
  legacyTheme?: LegacyHero | null
): Promise<SeedResult> {
  const existing = await tx.dealershipSection.count({ where: { dealershipId } });
  if (existing > 0) return { seeded: false, migratedHero: false };

  // 1. Crear las 7 secciones default. createMany es la opción más rápida y
  //    el unique constraint @@unique([dealershipId, type]) protege contra races.
  await tx.dealershipSection.createMany({
    data: SECTION_TYPES.map((type) => {
      const copy = DEFAULT_SECTION_COPY[type];
      return {
        dealershipId,
        type,
        enabled: !DISABLED_BY_DEFAULT.has(type),
        order: DEFAULT_SECTION_ORDER[type],
        title: copy.title,
        subtitle: copy.subtitle,
        content: copy.content,
        // Cast vía unknown porque los tipos de config son interfaces estrictas y
        // Prisma.InputJsonValue requiere index signature. El shape es serializable.
        config: DEFAULT_SECTION_CONFIG[type] as unknown as Prisma.InputJsonValue,
      };
    }),
  });

  // 2. Migración del hero legacy desde theme.heroUrl si aplica.
  let migratedHero = false;
  const heroUrl = legacyTheme?.heroUrl?.trim();
  const heroType = legacyTheme?.heroType?.trim();
  if (heroUrl && (heroType === "image" || heroType === "video")) {
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

  return { seeded: true, migratedHero };
}
