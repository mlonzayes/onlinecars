import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";
import {
  getDealershipBySlug,
  getPublishedVehicles,
  countPublishedVehicles,
  getAvailableBrands,
  getTenantBasePath,
  getTenantPublicUrl,
} from "@/lib/tenant";
import { VehicleCard } from "@/components/tenant/vehicle-card";
import {
  VehicleFilters,
  VehicleFiltersMobileTrigger,
} from "@/components/tenant/vehicle-filters";
import { VehicleSort } from "@/components/tenant/vehicle-sort";
import { CatalogPagination } from "@/components/tenant/catalog-pagination";
import type { Metadata } from "next";

// Cantidad de vehículos por página del catálogo público. Validado contra
// 2 cols mobile (6 filas) y 3 cols desktop (4 filas). Ver discusión de UX
// con el dealer si se cambia este número.
const VEHICLES_PER_PAGE = 12;

interface TenantCatalogPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dealership = await getDealershipBySlug(slug);
  if (!dealership) return { title: "No encontrado" };
  // Canonical propio y SIN query params. La page se sirve también con
  // ?page=2&brand=...&sort=..., y cada combinación de filtros es una URL nueva
  // para Google: sin esto compiten entre sí como contenido duplicado y diluyen
  // el crawl del catálogo. Todas apuntan a la URL limpia.
  //
  // Va absoluto porque el metadataBase que overridea el layout ya es el del
  // tenant, pero explicitarlo evita depender del orden de merge.
  return {
    title: `Catálogo de Vehículos | ${dealership.name}`,
    description: `Vehículos disponibles en ${dealership.name}. Mirá el stock actualizado, con fotos, precios y ficha completa de cada unidad.`,
    alternates: { canonical: `${getTenantPublicUrl(dealership)}/catalogo` },
  };
}

export default async function TenantCatalogPage({ params, searchParams }: TenantCatalogPageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const dealership = await getDealershipBySlug(slug);
  if (!dealership) notFound();

  // searchParams llegan como `string | undefined` libre. Para los enums (sort,
  // condition, bodyType) confiamos en que getPublishedVehicles ignora valores inválidos.
  const filters = {
    brand: sp.brand,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    condition: sp.condition,
    bodyType: sp.bodyType,
    sort: sp.sort,
  } as Parameters<typeof getPublishedVehicles>[1];

  // Página actual desde la URL. Si viene cualquier basura (NaN, negativo)
  // caemos en página 1 silenciosamente — no queremos romper el catálogo
  // porque alguien pegue `?page=foo`. Si excede el total, lo clampeamos
  // después de saber el `totalPages`.
  const pageParam = Number(sp.page);
  const requestedPage = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

  const [vehicles, totalCount, brands] = await Promise.all([
    getPublishedVehicles(dealership.id, filters, {
      page: requestedPage,
      limit: VEHICLES_PER_PAGE,
    }),
    countPublishedVehicles(dealership.id, filters),
    getAvailableBrands(dealership.id),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / VEHICLES_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const basePath = await getTenantBasePath(slug);

  // searchParams a preservar en los links de paginación. Importante: `page`
  // NO va, lo escribe el componente de paginación.
  const preservedQuery: Record<string, string | undefined> = {
    brand: sp.brand,
    minPrice: sp.minPrice,
    maxPrice: sp.maxPrice,
    condition: sp.condition,
    bodyType: sp.bodyType,
    sort: sp.sort,
  };

  return (
    // overflow-x-hidden solo en mobile (evita que un overflow horizontal deje ver
    // el fondo del body). En lg lo dejamos visible para no romper el sticky del aside.
    <div className="min-h-screen overflow-x-hidden lg:overflow-x-visible">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 w-full sm:mb-6">
          <div>
            <h1 className="text-lg font-semibold text-[var(--tenant-fg)] sm:text-2xl">
              Catálogo
            </h1>
            <p className="mt-0.5 text-xs text-[var(--tenant-fg-muted)] sm:text-sm">
              {totalCount} {totalCount === 1 ? "vehículo" : "vehículos"} encontrados
              {totalPages > 1 && (
                <span className="ml-1 text-[var(--tenant-fg-subtle)]">
                  · página {currentPage} de {totalPages}
                </span>
              )}
            </p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            {/* Trigger del sheet de filtros — sólo en mobile/tablet */}
            <div className="shrink-0 lg:hidden">
              <Suspense fallback={null}>
                <VehicleFiltersMobileTrigger brands={brands} />
              </Suspense>
            </div>
            <Suspense fallback={null}>
              <VehicleSort />
            </Suspense>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Filters Sidebar — sólo en desktop. En mobile el trigger del header
              abre el sheet con los mismos filtros. */}
          <aside className="hidden lg:col-span-1 lg:block">
            <div className="lg:sticky lg:top-24">
              <Suspense fallback={null}>
                <VehicleFilters brands={brands} />
              </Suspense>
            </div>
          </aside>

          {/* Results */}
          <div className="lg:col-span-3">
            {vehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--tenant-border-strong)] bg-[var(--tenant-surface)] py-16 text-center">
                <Search className="mb-3 h-8 w-8 text-[var(--tenant-fg-subtle)]" />
                <p className="text-sm font-medium text-[var(--tenant-fg)]">
                  No se encontraron vehículos
                </p>
                <p className="mt-1 text-xs text-[var(--tenant-fg-muted)]">
                  Probá ajustando los filtros.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                  {vehicles.map((vehicle) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} basePath={basePath} />
                  ))}
                </div>
                <CatalogPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  basePath={basePath}
                  preservedQuery={preservedQuery}
                />
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
