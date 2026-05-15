import { NextResponse } from "next/server";
import { getDealershipBySlug, getPublishedVehicles } from "@/lib/tenant";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { applyRateLimit, getClientIp, publicVehiclesLimiter } from "@/lib/rate-limit";

type TenantParams = { slug: string };

export const GET = withLogger<TenantParams>(async (request, { requestId, params }) => {
  const { slug } = params;

  // Catálogo público: rate limit por IP solamente. Defensa contra scraping
  // automatizado. 60 req/min es suficiente para navegación humana normal.
  const ip = getClientIp(request);
  const rl = await applyRateLimit(publicVehiclesLimiter, ip, requestId, { slug });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Probá en unos minutos." },
      { status: 429, headers: rl.headers }
    );
  }

  const dealership = await getDealershipBySlug(slug);

  if (!dealership) {
    logger.warn(requestId, "public.vehicles.tenant_not_found", { slug });
    return NextResponse.json(
      { error: "Concesionario no encontrado" },
      { status: 404, headers: rl.headers }
    );
  }

  const url = new URL(request.url);
  const filters = {
    brand: url.searchParams.get("brand") ?? undefined,
    minPrice: url.searchParams.get("minPrice") ? Number(url.searchParams.get("minPrice")) : undefined,
    maxPrice: url.searchParams.get("maxPrice") ? Number(url.searchParams.get("maxPrice")) : undefined,
    minYear: url.searchParams.get("minYear") ? Number(url.searchParams.get("minYear")) : undefined,
    maxYear: url.searchParams.get("maxYear") ? Number(url.searchParams.get("maxYear")) : undefined,
    fuelType: url.searchParams.get("fuelType") ?? undefined,
    transmission: url.searchParams.get("transmission") ?? undefined,
    condition: url.searchParams.get("condition") ?? undefined,
  };

  const vehicles = await getPublishedVehicles(dealership.id, filters);

  // Serializar Decimal
  const serialized = vehicles.map((v) => ({
    ...v,
    price: v.price.toString(),
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
    publishedAt: v.publishedAt?.toISOString() ?? null,
  }));

  logger.info(requestId, "public.vehicles.list.ok", {
    slug,
    dealershipId: dealership.id,
    count: serialized.length,
  });

  return NextResponse.json({ data: serialized }, { headers: rl.headers });
});
