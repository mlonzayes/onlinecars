import { prisma } from "./prisma";
import type { Dealership, DealershipMedia, DealershipSection } from "@prisma/client";
import { redis } from "./redis";
import { logger } from "./logger";
import type { DealershipTheme } from "@/types";
import { SECTION_TYPES, type MediaPurpose, type SectionType } from "./constants";
import { DEFAULT_SECTION_COPY, DEFAULT_SECTION_CONFIG } from "./tenant-defaults";
import type { SectionConfigByType } from "./sections/config-types";
import { seedDefaultSections } from "./sections/seed";

/**
 * Obtiene un dealership por su slug.
 * Usado en las páginas públicas del tenant (subdomain) — cache-aside Upstash.
 * Misma TTL que el bundle (30 min) y se invalida en conjunto.
 */
export async function getDealershipBySlug(slug: string): Promise<Dealership | null> {
  const key = tenantDealershipKey(slug);

  try {
    const cached = await redis.get<Dealership>(key);
    if (cached) return cached;
  } catch (error) {
    logger.warn(undefined, "tenant.dealership.cache_read_failed", {
      slug,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // findUnique con compound where (slug + active) genera SQL con OR redundante en
  // Prisma 7. Buscamos solo por slug y filtramos active en JS.
  const dealership = await prisma.dealership.findUnique({ where: { slug } });
  if (!dealership || !dealership.active) return null;

  try {
    await redis.set(key, dealership, { ex: TENANT_HOME_TTL_SECONDS });
  } catch (error) {
    logger.warn(undefined, "tenant.dealership.cache_write_failed", {
      slug,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return dealership;
}

/**
 * Obtiene los vehículos publicados de un dealership.
 * Solo devuelve vehículos con publishedAt != null.
 */
// Sort keys soportados por el catálogo público.
// "recent" (default) prioriza featured + lo más nuevo. El resto son sort puros sobre el campo.
export const PUBLIC_VEHICLE_SORTS = [
  "recent",
  "price_asc",
  "price_desc",
  "km_asc",
  "year_desc",
] as const;
export type PublicVehicleSort = (typeof PUBLIC_VEHICLE_SORTS)[number];

import type { Prisma } from "@prisma/client";

function buildOrderBy(
  sort: PublicVehicleSort
): Prisma.VehicleOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ price: "asc" }];
    case "price_desc":
      return [{ price: "desc" }];
    case "km_asc":
      // PostgreSQL pone NULLs al final con asc por default — vehículos sin km cargados
      // quedan al final, que es razonable.
      return [{ kilometers: "asc" }];
    case "year_desc":
      return [{ year: "desc" }];
    case "recent":
    default:
      return [{ featured: "desc" }, { createdAt: "desc" }];
  }
}

export async function getPublishedVehicles(
  dealershipId: string,
  filters?: {
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    minYear?: number;
    maxYear?: number;
    fuelType?: string;
    transmission?: string;
    condition?: string;
    bodyType?: string;
    sort?: PublicVehicleSort;
  }
) {
  const where: Record<string, unknown> = {
    dealershipId,
    publishedAt: { not: null },
    status: "available",
  };

  if (filters?.brand) where.brand = { equals: filters.brand, mode: "insensitive" };
  if (filters?.fuelType) where.fuelType = filters.fuelType;
  if (filters?.transmission) where.transmission = filters.transmission;
  if (filters?.condition) where.condition = filters.condition;
  if (filters?.bodyType) where.bodyType = filters.bodyType;

  if (filters?.minPrice || filters?.maxPrice) {
    where.price = {
      ...(filters.minPrice ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice ? { lte: filters.maxPrice } : {}),
    };
  }

  if (filters?.minYear || filters?.maxYear) {
    where.year = {
      ...(filters.minYear ? { gte: filters.minYear } : {}),
      ...(filters.maxYear ? { lte: filters.maxYear } : {}),
    };
  }

  return prisma.vehicle.findMany({
    where,
    include: {
      images: { orderBy: { order: "asc" } },
    },
    orderBy: buildOrderBy(filters?.sort ?? "recent"),
  });
}

/**
 * Obtiene un vehículo publicado por su ID dentro de un dealership.
 */
export async function getPublishedVehicleById(dealershipId: string, vehicleId: string) {
  return prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      dealershipId,
      publishedAt: { not: null },
    },
    include: {
      images: { orderBy: { order: "asc" } },
      dealership: true,
    },
  });
}

/**
 * Obtiene las marcas únicas de vehículos publicados de un dealership.
 * Útil para los filtros.
 */
export async function getAvailableBrands(dealershipId: string): Promise<string[]> {
  const brands = await prisma.vehicle.findMany({
    where: {
      dealershipId,
      publishedAt: { not: null },
      status: "available",
    },
    select: { brand: true },
    distinct: ["brand"],
    orderBy: { brand: "asc" },
  });

  return brands.map((b) => b.brand);
}

import GLOBAL_BRANDS from "@/data/brands.json";

/**
 * Combina las marcas en stock con las marcas oficiales configuradas en el theme.
 * Prioriza las marcas oficiales para mostrar sus logos.
 *
 * Recibe stockBrands ya resueltas para evitar duplicar la query de marcas cuando
 * se llama desde fetchTenantHomeBundleFromDb (que ya las obtiene en el Promise.all).
 */
export function getDisplayBrands(
  stockBrands: string[],
  theme: { selectedBrandIds?: string[] } | null | undefined
): { name: string; logoUrl: string | null }[] {
  const selectedIds: string[] = theme?.selectedBrandIds || [];

  // Empezar con las marcas oficiales (buscadas en el JSON global)
  const displayBrands: { name: string; logoUrl: string | null }[] = [];

  for (const id of selectedIds) {
    const globalBrand = GLOBAL_BRANDS.find((b) => b.id === id);
    if (globalBrand) {
      displayBrands.push({ name: globalBrand.name, logoUrl: globalBrand.logoUrl });
    }
  }

  // Agregar las marcas en stock que no estén en las oficiales. Si la marca en stock
  // matchea una marca global no seleccionada, le ponemos el logo igual.
  for (const brand of stockBrands) {
    if (!displayBrands.some((b) => b.name.toLowerCase() === brand.toLowerCase())) {
      const foundInGlobal = GLOBAL_BRANDS.find((b) => b.name.toLowerCase() === brand.toLowerCase());
      displayBrands.push({
        name: brand,
        logoUrl: foundInGlobal ? foundInGlobal.logoUrl : null
      });
    }
  }

  return displayBrands;
}

/**
 * Obtiene las reseñas aprobadas de un dealership.
 */
export async function getApprovedReviews(dealershipId: string) {
  return prisma.review.findMany({
    where: {
      dealershipId,
      status: "approved",
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

// ============================================================================
// Tenant home bundle — cache-aside del paquete completo del home del tenant.
// ============================================================================
//
// Una sola key Redis por slug. Se invalida desde los handlers de mutación que
// afecten cualquier dato del bundle (vehículos, reviews, theme, etc.) llamando
// invalidateTenantHomeBundle(slug). TTL es safety net: la fuente de verdad es
// la invalidación activa.
//
// El bundle se almacena ya serializado (Decimal → string, Date → ISO string)
// para que los Server Components que lo consumen puedan pasarlo a Client
// Components sin re-procesar.

const TENANT_HOME_TTL_SECONDS = 1800; // 30 min

function tenantHomeKey(slug: string): string {
  return `tenant:${slug}:home`;
}

function tenantDealershipKey(slug: string): string {
  return `tenant:${slug}:dealership`;
}

export interface TenantHomeBundleVehicle {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: string;
  currency: string;
  kilometers: number | null;
  fuelType: string | null;
  transmission: string | null;
  bodyType: string | null;
  condition: string;
  featured: boolean;
  images: Array<{
    id: string;
    url: string;
    isPrimary: boolean;
    alt: string | null;
  }>;
}

export interface TenantHomeBundleReview {
  id: string;
  name: string;
  content: string;
  rating: number;
  createdAt: string;
}

export interface TenantHomeBundleDealership {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  website: string | null;
  theme: DealershipTheme | null;
}

export interface TenantHomeBundleSection {
  id: string;
  type: SectionType;
  enabled: boolean;
  order: number;
  title: string;        // resuelto: DB value || DEFAULT_SECTION_COPY[type].title
  subtitle: string | null;
  content: string | null;
  config: SectionConfigByType[SectionType]; // resuelto: parsed con fallback a default
}

export interface TenantHomeBundleMedia {
  id: string;
  purpose: MediaPurpose;
  url: string;
  mimeType: string;
  order: number;
}

export interface TenantHomeBundle {
  dealership: TenantHomeBundleDealership;
  vehicles: TenantHomeBundleVehicle[];
  stockBrands: string[];
  displayBrands: { name: string; logoUrl: string | null }[];
  reviews: TenantHomeBundleReview[];
  sections: TenantHomeBundleSection[];
  mediaBySection: Record<SectionType, TenantHomeBundleMedia[]>;
}

export function resolveSection(row: DealershipSection): TenantHomeBundleSection {
  const type = row.type as SectionType;
  const defaultCopy = DEFAULT_SECTION_COPY[type];
  const defaultConfig = DEFAULT_SECTION_CONFIG[type];

  // El config se guarda como Json. Si viene null o tiene shape inválido,
  // caemos al default sin romper la página pública (silencioso por design).
  let config = defaultConfig as SectionConfigByType[SectionType];
  if (row.config !== null && typeof row.config === "object" && !Array.isArray(row.config)) {
    // Merge superficial: campos del DB pisan defaults. Validación profunda corre en PATCH.
    config = {
      ...defaultConfig,
      ...(row.config as Record<string, unknown>),
    } as SectionConfigByType[SectionType];
  }

  return {
    id: row.id,
    type,
    enabled: row.enabled,
    order: row.order,
    title: row.title?.trim() || defaultCopy.title,
    subtitle: row.subtitle?.trim() || defaultCopy.subtitle,
    content: row.content?.trim() || defaultCopy.content,
    config,
  };
}

function groupMediaBySection(
  rows: DealershipMedia[]
): Record<SectionType, TenantHomeBundleMedia[]> {
  const result = SECTION_TYPES.reduce<Record<SectionType, TenantHomeBundleMedia[]>>(
    (acc, type) => {
      acc[type] = [];
      return acc;
    },
    {} as Record<SectionType, TenantHomeBundleMedia[]>
  );

  for (const m of rows) {
    const sectionType = m.sectionType as SectionType;
    if (!result[sectionType]) continue;
    result[sectionType].push({
      id: m.id,
      purpose: m.purpose as MediaPurpose,
      url: m.url,
      mimeType: m.mimeType,
      order: m.order,
    });
  }
  return result;
}

async function fetchTenantHomeBundleFromDb(
  slug: string
): Promise<TenantHomeBundle | null> {
  const dealership = await getDealershipBySlug(slug);
  if (!dealership) return null;

  const theme = dealership.theme as DealershipTheme | null;

  // Lazy seed dentro de una transacción. Idempotente: si ya hay secciones, no hace nada.
  const seedResult = await prisma.$transaction(async (tx) => {
    return seedDefaultSections(tx, dealership.id, theme);
  });

  if (seedResult.seeded) {
    logger.info(undefined, "tenant.sections.seeded", {
      dealershipId: dealership.id,
      slug,
      migratedHero: seedResult.migratedHero,
    });
  }

  const [vehicles, stockBrands, reviews, sectionRows, mediaRows] = await Promise.all([
    getPublishedVehicles(dealership.id),
    getAvailableBrands(dealership.id),
    getApprovedReviews(dealership.id),
    prisma.dealershipSection.findMany({
      where: { dealershipId: dealership.id },
      orderBy: { order: "asc" },
    }),
    prisma.dealershipMedia.findMany({
      where: { dealershipId: dealership.id },
      orderBy: { order: "asc" },
    }),
  ]);

  // displayBrands se calcula sync a partir de stockBrands ya resueltas + theme.
  // Antes esto disparaba una segunda query a vehicles duplicando getAvailableBrands.
  const displayBrands = getDisplayBrands(stockBrands, theme);

  // Mismo cap que la page actual: 18 vehículos en el home (featured + recent).
  const featured = vehicles.filter((v) => v.featured);
  const others = vehicles.filter((v) => !v.featured);
  const candidates = [...featured, ...others].slice(0, 18);

  return {
    dealership: {
      id: dealership.id,
      name: dealership.name,
      slug: dealership.slug,
      description: dealership.description,
      logo: dealership.logo,
      phone: dealership.phone,
      email: dealership.email,
      whatsapp: dealership.whatsapp,
      address: dealership.address,
      city: dealership.city,
      province: dealership.province,
      website: dealership.website,
      theme,
    },
    vehicles: candidates.map((v) => ({
      id: v.id,
      title: v.title,
      brand: v.brand,
      model: v.model,
      year: v.year,
      price: v.price.toString(),
      currency: v.currency,
      kilometers: v.kilometers,
      fuelType: v.fuelType,
      transmission: v.transmission,
      bodyType: v.bodyType,
      condition: v.condition,
      featured: v.featured,
      images: v.images.map((img) => ({
        id: img.id,
        url: img.url,
        isPrimary: img.isPrimary,
        alt: img.alt,
      })),
    })),
    stockBrands,
    displayBrands,
    reviews: reviews.map((r) => ({
      id: r.id,
      name: r.name,
      content: r.content,
      rating: r.rating,
      createdAt: r.createdAt.toISOString(),
    })),
    sections: sectionRows.map(resolveSection),
    mediaBySection: groupMediaBySection(mediaRows),
  };
}

/**
 * Devuelve el paquete completo de datos del home del tenant.
 * Cache-aside con Upstash. Fail-open en errores de Redis (cae a DB).
 */
export async function getTenantHomeBundle(
  slug: string
): Promise<TenantHomeBundle | null> {
  const key = tenantHomeKey(slug);

  try {
    const cached = await redis.get<TenantHomeBundle>(key);
    if (cached) return cached;
  } catch (error) {
    // Cache caído — fail-open. Loggeamos pero no fallamos la request.
    logger.warn(undefined, "tenant.home.cache_read_failed", {
      slug,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const bundle = await fetchTenantHomeBundleFromDb(slug);
  if (!bundle) return null;

  try {
    await redis.set(key, bundle, { ex: TENANT_HOME_TTL_SECONDS });
  } catch (error) {
    logger.warn(undefined, "tenant.home.cache_write_failed", {
      slug,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return bundle;
}

/**
 * Invalida el cache del home del tenant. Llamar desde TODOS los handlers que
 * modifiquen datos visibles en el home: vehículos, reviews, theme, dealership.
 *
 * No tira si Redis está caído — solo loggea (mismo principio fail-open).
 */
export async function invalidateTenantHomeBundle(slug: string): Promise<void> {
  try {
    await Promise.all([
      redis.del(tenantHomeKey(slug)),
      redis.del(tenantDealershipKey(slug)),
    ]);
  } catch (error) {
    logger.warn(undefined, "tenant.home.cache_invalidate_failed", {
      slug,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
