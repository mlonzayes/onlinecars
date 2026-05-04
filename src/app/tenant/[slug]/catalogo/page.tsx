import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";
import { getDealershipBySlug, getPublishedVehicles, getAvailableBrands } from "@/lib/tenant";
import { VehicleCard } from "@/components/tenant/vehicle-card";
import { VehicleFilters } from "@/components/tenant/vehicle-filters";
import { VehicleSort } from "@/components/tenant/vehicle-sort";
import type { Metadata } from "next";

interface TenantCatalogPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dealership = await getDealershipBySlug(slug);
  if (!dealership) return { title: "No encontrado" };
  return {
    title: `Catálogo de Vehículos | ${dealership.name}`,
  };
}

export default async function TenantCatalogPage({ params, searchParams }: TenantCatalogPageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const dealership = await getDealershipBySlug(slug);
  if (!dealership) notFound();

  const filters: any = {
    brand: sp.brand,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    condition: sp.condition,
    sort: sp.sort,
  };

  const [vehicles, brands] = await Promise.all([
    getPublishedVehicles(dealership.id, filters),
    getAvailableBrands(dealership.id),
  ]);

  const basePath = `/tenant/${slug}`;

  return (
    <div className="bg-gray-50 min-h-screen">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
              Catálogo
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {vehicles.length} {vehicles.length === 1 ? "vehículo" : "vehículos"} encontrados
            </p>
          </div>
          <Suspense fallback={null}>
            <VehicleSort />
          </Suspense>
        </header>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Filters Sidebar — VehicleFilters ya trae su propia card, no envolverlo. */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <Suspense fallback={null}>
                <VehicleFilters brands={brands} />
              </Suspense>
            </div>
          </aside>

          {/* Results */}
          <div className="lg:col-span-3">
            {vehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
                <Search className="mb-3 h-8 w-8 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">
                  No se encontraron vehículos
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Probá ajustando los filtros.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {vehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} basePath={basePath} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
