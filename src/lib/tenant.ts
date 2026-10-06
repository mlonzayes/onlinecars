import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "./prisma";
import type { Dealership, DealershipMedia, DealershipSection } from "@prisma/client";
import { redis } from "./redis";
import { logger } from "./logger";
import type { DealershipTheme, SocialLinks } from "@/types";
import { SECTION_TYPES, type Country, type MediaPurpose, type SectionType } from "./constants";
import { DEFAULT_SECTION_COPY, DEFAULT_SECTION_CONFIG } from "./tenant-defaults";
import type { SectionConfigByType } from "./sections/config-types";
import { seedDefaultSections } from "./sections/seed";
import { getTenantPathPrefix, tenantSiteTag } from "./tenant-routing";

// El basePath de los links vive en tenant-routing.ts (lo usa también el
// middleware, que no puede importar Prisma). Se re-exporta por compatibilidad.
export { getTenantBasePath, getTenantPathPrefix } from "./tenant-routing";

/**
 * URL pública ABSOLUTA del sitio del tenant (para canonical, sitemap, JSON-LD).
 * Si el dealer cargó un dominio custom (`website`), lo usa; si no, el subdominio
 * `{slug}.{appDomain}`. Esto deja el SEO listo para cuando enchufe su dominio.
 */
export function getTenantPublicUrl(dealership: {
  slug: string;
  website?: string | null;
}): string {
  if (dealership.website) {
    const host = dealership.website.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "motorflowapp.com";
  return `https://${dealership.slug}.${appDomain}`;
}

/**
 * Lee el dealership público directo de la DB, SIN Redis.
 *
 * Es el lector de las PÁGINAS del tenant (vía tenant-render.ts). Las páginas son
 * ISR y el cliente de Upstash hace fetch con `cache: "no-store"`: llamarlo durante
 * un render estático tira "Dynamic server usage" y la página responde 500.
 * Pasó en producción. Con ISR el cache es el HTML, así que Redis ahí sobra.
 *
 * siteEnabled gateado acá: si el dealer no activó su sitio, TODAS las rutas
 * públicas del tenant ven 404 — páginas, API públicos y rewrites del middleware.
 */
export async function getPublicDealershipFromDb(slug: string): Promise<Dealership | null> {
  // findUnique con compound where (slug + active) genera SQL con OR redundante en
  // Prisma 7. Buscamos solo por slug y filtramos en JS.
  const dealership = await prisma.dealership.findUnique({ where: { slug } });
  if (!dealership || !dealership.active || !dealership.siteEnabled) return null;
  return dealership;
}

/**
 * Obtiene un dealership por su slug con cache-aside Upstash.
 * SOLO para handlers dinámicos (API públicos, robots/sitemap/llms). En páginas
 * del tenant usar getTenantDealership() de tenant-render.ts (ver arriba por qué).
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

  const dealership = await getPublicDealershipFromDb(slug);
  if (!dealership) return null;

  try {
    await redis.set(key, dealership, { ex: TENANT_DEALERSHIP_TTL_SECONDS });
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

export interface PublicVehicleFilters {
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

export interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * Construye el `where` de Prisma a partir de los filtros públicos. Se usa
 * tanto en `findMany` como en `count` — extraído acá para no duplicar la lógica.
 */
function buildPublishedVehiclesWhere(
  dealershipId: string,
  filters?: PublicVehicleFilters
): Record<string, unknown> {
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

  return where;
}

export async function getPublishedVehicles(
  dealershipId: string,
  filters?: PublicVehicleFilters,
  pagination?: PaginationOptions
) {
  const where = buildPublishedVehiclesWhere(dealershipId, filters);

  return prisma.vehicle.findMany({
    where,
    include: {
      images: { orderBy: { order: "asc" } },
    },
    orderBy: buildOrderBy(filters?.sort ?? "recent"),
    ...(pagination
      ? {
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit,
        }
      : {}),
  });
}

/**
 * Cuenta los vehículos publicados que matchean los filtros. Lo usamos en
 * paralelo con `getPublishedVehicles(paginated)` para armar los controles
 * de paginación.
 */
export async function countPublishedVehicles(
  dealershipId: string,
  filters?: PublicVehicleFilters
): Promise<number> {
  const where = buildPublishedVehiclesWhere(dealershipId, filters);
  return prisma.vehicle.count({ where });
}

/**
 * Resuelve un vehículo publicado por su publicSlug (URL-friendly).
 * Reemplazó a `getPublishedVehicleById` para no exponer UUIDs en el sitio.
 */
export async function getPublishedVehicleBySlug(
  dealershipId: string,
  publicSlug: string
) {
  return prisma.vehicle.findFirst({
    where: {
      publicSlug,
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
 * se llama desde getTenantHomeBundleFromDb (que ya las obtiene en el Promise.all).
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
// Tenant home bundle — el paquete completo de datos del home del tenant.
// ============================================================================
//
// Ya NO se cachea en Redis: el home es ISR y el cache es el HTML que guarda
// Vercel (ver tenant/[slug]/layout.tsx). Se invalida desde los handlers de
// mutación con invalidateTenantHomeBundle(slug).
//
// El bundle sale ya serializado (Decimal → string, Date → ISO string) para que
// los Server Components lo pasen a Client Components sin re-procesar.

// TTL del dealership cacheado en Redis (lo leen los handlers dinámicos).
const TENANT_DEALERSHIP_TTL_SECONDS = 1800; // 30 min

function tenantDealershipKey(slug: string): string {
  return `tenant:${slug}:dealership`;
}

export interface TenantHomeBundleVehicle {
  id: string;
  publicSlug: string;
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
  // Si false, la dirección no se muestra en el sitio público (elección del dealer).
  showAddress: boolean;
  city: string | null;
  province: string | null;
  // País del concesionario (ISO-2). Lo consume el JSON-LD `AutoDealer`:
  // `addressCountry` y `areaServed` estaban hardcodeados en "AR", así que un
  // dealer de México publicaba structured data diciendo que estaba en
  // Argentina y Google lo dejaba afuera del pack local de su ciudad.
  country: Country;
  website: string | null;
  // Plantilla visual activa. Vive en el bundle (y no se resuelve aparte) porque
  // el home la necesita para decidir si usa layout fijo o las secciones
  // configurables. Comparte la staleness del resto del bundle cacheado, y los
  // dos handlers que la escriben (/api/concesionario y /api/admin/dealerships)
  // ya llaman a invalidateTenantHomeBundle.
  templateId: string | null;
  theme: DealershipTheme | null;
  // Ubicación geo para el mapa del sitio. Las coords vienen resueltas del
  // dashboard. La visibilidad la decide el config.showMap de la sección Contacto.
  latitude: number | null;
  longitude: number | null;
  mapLabel: string | null;
  // Links a redes sociales (URLs ya normalizadas). null = sin redes cargadas.
  socialLinks: SocialLinks | null;
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

// Carrusel fijo del home, segmentado por categoría. Se arma desde la lista de
// publicados ya cargada (sin queries extra) y se auto-oculta si queda vacío.
export interface TenantHomeCollection {
  key: string;
  label: string;
  vehicles: TenantHomeBundleVehicle[];
}

export interface TenantHomeBundle {
  dealership: TenantHomeBundleDealership;
  vehicles: TenantHomeBundleVehicle[];
  stockBrands: string[];
  displayBrands: { name: string; logoUrl: string | null }[];
  reviews: TenantHomeBundleReview[];
  sections: TenantHomeBundleSection[];
  mediaBySection: Record<SectionType, TenantHomeBundleMedia[]>;
  collections: TenantHomeCollection[];
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

type PublishedVehicleRow = Awaited<ReturnType<typeof getPublishedVehicles>>[number];

function serializeVehicle(v: PublishedVehicleRow): TenantHomeBundleVehicle {
  return {
    id: v.id,
    publicSlug: v.publicSlug,
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
  };
}

// Carruseles fijos del home. Cada uno filtra la lista de publicados (ya en
// memoria) y se auto-oculta si queda vacío. Sin queries extra.
const COLLECTION_CAP = 12;

// Esta colección se renderiza DENTRO del bloque catálogo (entre la doble CTA
// "vender/comprar" y "por qué elegirnos"). El resto se intercala a nivel page.
export const CATALOG_CAROUSEL_KEY = "pickups_suv";

function buildCollections(vehicles: PublishedVehicleRow[]): TenantHomeCollection[] {
  const defs: { key: string; label: string; rows: PublishedVehicleRow[] }[] = [
    { key: "nuevos", label: "0km", rows: vehicles.filter((v) => v.condition === "new") },
    { key: "usados", label: "Usados", rows: vehicles.filter((v) => v.condition === "used") },
    {
      key: "pickups_suv",
      label: "Pickups & SUVs",
      rows: vehicles.filter((v) => v.bodyType === "pickup" || v.bodyType === "suv"),
    },
    {
      key: "oportunidades",
      label: "Oportunidades",
      rows: [...vehicles].sort((a, b) => a.price.toNumber() - b.price.toNumber()),
    },
  ];

  return defs
    .map((d) => ({
      key: d.key,
      label: d.label,
      vehicles: d.rows.slice(0, COLLECTION_CAP).map(serializeVehicle),
    }))
    .filter((c) => c.vehicles.length > 0);
}

/**
 * Bundle del home leído de la DB, sin Redis. En páginas usar
 * getTenantHomeBundle() de tenant-render.ts, que además deduplica por render.
 */
export async function getTenantHomeBundleFromDb(
  slug: string
): Promise<TenantHomeBundle | null> {
  const dealership = await getPublicDealershipFromDb(slug);
  if (!dealership) return null;
  return assembleTenantHomeBundle(dealership);
}

/**
 * Versión PREVIEW del bundle: arma el home SIN gatear por siteEnabled, para que
 * el dueño autenticado pueda previsualizar su sitio antes de habilitarlo.
 * Sin cache (preview siempre fresco, y no contamina el cache público).
 */
export async function getTenantHomeBundleForPreview(
  slug: string
): Promise<TenantHomeBundle | null> {
  const dealership = await prisma.dealership.findUnique({ where: { slug } });
  if (!dealership || !dealership.active) return null;
  return assembleTenantHomeBundle(dealership);
}

async function assembleTenantHomeBundle(
  dealership: Dealership
): Promise<TenantHomeBundle> {
  const theme = dealership.theme as DealershipTheme | null;

  // Lazy seed. El count va fuera de la transacción para evitar timeouts de
  // $transaction en cold starts de Neon (P2028: Transaction not found). Solo
  // abrimos transacción cuando realmente hay que sembrar. Timeout extendido
  // a 15s para tolerar el cold start.
  const existingSections = await prisma.dealershipSection.count({
    where: { dealershipId: dealership.id },
  });

  if (existingSections === 0) {
    const seedResult = await prisma.$transaction(
      async (tx) => seedDefaultSections(tx, dealership.id, theme),
      { timeout: 15_000 }
    );
    if (seedResult.seeded) {
      logger.info(undefined, "tenant.sections.seeded", {
        dealershipId: dealership.id,
        slug: dealership.slug,
        migratedHero: seedResult.migratedHero,
      });
    }
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
      showAddress: dealership.showAddress,
      city: dealership.city,
      province: dealership.province,
      country: dealership.country as Country,
      website: dealership.website,
      templateId: dealership.templateId,
      theme,
      latitude: dealership.latitude,
      longitude: dealership.longitude,
      mapLabel: dealership.mapLabel,
      socialLinks: (dealership.socialLinks as SocialLinks | null) ?? null,
    },
    vehicles: candidates.map(serializeVehicle),
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
    collections: buildCollections(vehicles),
  };
}

/**
 * Invalida el sitio público del tenant: el HTML ISR de todas sus páginas y el
 * dealership cacheado en Redis. Llamar desde TODOS los handlers que modifiquen
 * datos visibles en el sitio: vehículos, reviews, theme, dealership, secciones.
 *
 * No tira si Redis está caído — solo loggea (mismo principio fail-open).
 */
export async function invalidateTenantHomeBundle(slug: string): Promise<void> {
  try {
    await redis.del(tenantDealershipKey(slug));
  } catch (error) {
    logger.warn(undefined, "tenant.home.cache_invalidate_failed", {
      slug,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Las páginas del tenant son ISR (ver tenant/[slug]/layout.tsx). "layout"
  // invalida TODAS las páginas bajo /tenant/{slug} (home, fichas, cotizar...).
  // try/catch: fuera de un request (scripts, tests) revalidatePath tira.
  try {
    revalidatePath(getTenantPathPrefix(slug), "layout");
    // Dealership + catálogo cacheados con unstable_cache (ver tenant-render.ts).
    revalidateTag(tenantSiteTag(slug));
  } catch (error) {
    logger.warn(undefined, "tenant.isr.revalidate_failed", {
      slug,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
