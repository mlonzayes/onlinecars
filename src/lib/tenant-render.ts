import { cache } from "react";
import type { Dealership } from "@prisma/client";
import {
  getPublicDealershipFromDb,
  getTenantHomeBundleFromDb,
  type TenantHomeBundle,
} from "./tenant";

/**
 * Lectores de datos para las PÁGINAS del sitio del tenant (layout, pages y sus
 * generateMetadata). Usar SIEMPRE estos ahí, nunca getDealershipBySlug:
 *
 * - Leen la DB directo, sin Redis. Las páginas son ISR y el fetch `no-store` de
 *   Upstash tira "Dynamic server usage" en un render estático → 500.
 * - `cache()` de React deduplica dentro de un mismo render: layout,
 *   generateMetadata y la page piden el mismo dealership y sale UNA query.
 */
export const getTenantDealership = cache(
  (slug: string): Promise<Dealership | null> => getPublicDealershipFromDb(slug)
);

export const getTenantHomeBundle = cache(
  (slug: string): Promise<TenantHomeBundle | null> => getTenantHomeBundleFromDb(slug)
);
