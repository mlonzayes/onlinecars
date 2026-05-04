import { prisma } from "./prisma";
import type { Dealership } from "@prisma/client";

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
