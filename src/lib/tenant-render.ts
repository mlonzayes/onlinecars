import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Dealership } from "@prisma/client";
import {
  countPublishedVehicles,
  getAvailableBrands,
  getPublicDealershipFromDb,
  getPublishedVehicles,
  getTenantHomeBundleFromDb,
  type PublicVehicleFilters,
  type TenantHomeBundle,
} from "./tenant";
import { tenantSiteTag } from "./tenant-routing";
import type { VehicleCardData } from "@/components/tenant/vehicle-card";

/**
 * Lectores de datos para las PÁGINAS del sitio del tenant (layout, pages y sus
 * generateMetadata). Usar SIEMPRE estos ahí, nunca getDealershipBySlug:
 *
 * - Nada de Redis: las páginas son ISR y el fetch `no-store` de Upstash tira
 *   "Dynamic server usage" en un render estático → 500.
 * - `unstable_cache` con el tag del sitio: las páginas dinámicas (catálogo) y
 *   las regeneraciones ISR no despiertan la base en cada pedido. Neon (plan
 *   free) se apaga a los 5 min sin uso y despertarla cuesta 1-2 s.
 * - `cache()` de React deduplica dentro de un render (layout + metadata + page).
 *
 * Todo se invalida con invalidateTenantHomeBundle(slug) (revalidateTag).
 */

const SITE_REVALIDATE_SECONDS = 1800; // red de seguridad, igual que el ISR

// unstable_cache serializa a JSON: las fechas vuelven como string.
const DEALERSHIP_DATE_FIELDS = ["createdAt", "updatedAt", "trialEndsAt", "paidUntil"] as const;

function reviveDealership(row: Dealership | null): Dealership | null {
  if (!row) return null;
  const revived = { ...row };
  for (const key of DEALERSHIP_DATE_FIELDS) {
    const value = revived[key] as unknown;
    if (typeof value === "string") (revived as Record<string, unknown>)[key] = new Date(value);
  }
  return revived;
}

export const getTenantDealership = cache(
  async (slug: string): Promise<Dealership | null> =>
    reviveDealership(
      await unstable_cache(
        () => getPublicDealershipFromDb(slug),
        ["tenant-dealership", slug],
        { tags: [tenantSiteTag(slug)], revalidate: SITE_REVALIDATE_SECONDS }
      )()
    )
);

export const getTenantHomeBundle = cache(
  (slug: string): Promise<TenantHomeBundle | null> => getTenantHomeBundleFromDb(slug)
);

export interface TenantCatalogData {
  vehicles: VehicleCardData[];
  totalCount: number;
  brands: string[];
}

/**
 * Datos del catálogo público (una página de resultados + total + marcas),
 * cacheados por combinación de filtros. Los vehículos se guardan ya con la
 * forma de la card (precio como string, sin fechas) para que el JSON de la
 * cache no cambie tipos por debajo.
 */
export function getTenantCatalog(
  slug: string,
  dealershipId: string,
  filters: PublicVehicleFilters,
  page: number,
  limit: number
): Promise<TenantCatalogData> {
  return unstable_cache(
    async (): Promise<TenantCatalogData> => {
      const [rows, totalCount, brands] = await Promise.all([
        getPublishedVehicles(dealershipId, filters, { page, limit }),
        countPublishedVehicles(dealershipId, filters),
        getAvailableBrands(dealershipId),
      ]);
      const vehicles: VehicleCardData[] = rows.map((v) => ({
        id: v.id,
        publicSlug: v.publicSlug,
        title: v.title,
        condition: v.condition,
        featured: v.featured,
        kilometers: v.kilometers,
        fuelType: v.fuelType,
        transmission: v.transmission,
        bodyType: v.bodyType,
        price: v.price.toString(),
        currency: v.currency,
        images: v.images.map((i) => ({ url: i.url, isPrimary: i.isPrimary, alt: i.alt ?? null })),
      }));
      return { vehicles, totalCount, brands };
    },
    ["tenant-catalog", slug, JSON.stringify(filters), String(page), String(limit)],
    { tags: [tenantSiteTag(slug)], revalidate: SITE_REVALIDATE_SECONDS }
  )();
}
