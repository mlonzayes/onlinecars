import { prisma } from "./prisma";
import type { Dealership } from "@prisma/client";
import { redis } from "./redis";
import { logger } from "./logger";
import type { DealershipTheme } from "@/types";

/**
 * Obtiene un dealership por su slug.
 * Usado en las páginas públicas del tenant (subdomain).
 */
export async function getDealershipBySlug(slug: string): Promise<Dealership | null> {
  return prisma.dealership.findUnique({
    where: { slug, active: true },
  });
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
 */
export async function getDisplayBrands(dealershipId: string, theme: any): Promise<{ name: string; logoUrl: string | null }[]> {
  const stockBrands = await getAvailableBrands(dealershipId);
  const selectedIds: string[] = theme?.selectedBrandIds || [];

  // Empezar con las marcas oficiales (buscadas en el JSON global)
  const displayBrands: { name: string; logoUrl: string | null }[] = [];

  for (const id of selectedIds) {
    const globalBrand = GLOBAL_BRANDS.find((b) => b.id === id);
    if (globalBrand) {
      displayBrands.push({ name: globalBrand.name, logoUrl: globalBrand.logoUrl });
    }
  }

  // Agregar las marcas en stock que no estén en las oficiales
  for (const brand of stockBrands) {
    if (!displayBrands.some((b) => b.name.toLowerCase() === brand.toLowerCase())) {
      // Si la marca en stock coincide con una global no seleccionada, podríamos usar su logo, pero
      // como no la seleccionaron, es mejor dejarla genérica o podemos buscarla igual.
      // Para darle un toque de magia, si existe en global, le ponemos el logo igual.
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

export interface TenantHomeBundle {
  dealership: TenantHomeBundleDealership;
  vehicles: TenantHomeBundleVehicle[];
  stockBrands: string[];
  displayBrands: { name: string; logoUrl: string | null }[];
  reviews: TenantHomeBundleReview[];
}

async function fetchTenantHomeBundleFromDb(
  slug: string
): Promise<TenantHomeBundle | null> {
  const dealership = await getDealershipBySlug(slug);
  if (!dealership) return null;

  const theme = dealership.theme as DealershipTheme | null;

  const [vehicles, stockBrands, reviews, displayBrands] = await Promise.all([
    getPublishedVehicles(dealership.id),
    getAvailableBrands(dealership.id),
    getApprovedReviews(dealership.id),
    getDisplayBrands(dealership.id, theme),
  ]);

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
    await redis.del(tenantHomeKey(slug));
  } catch (error) {
    logger.warn(undefined, "tenant.home.cache_invalidate_failed", {
      slug,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
