import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleTable } from "@/components/dashboard/vehicle-table";
import { VehiclesTabs } from "@/components/dashboard/vehicles-tabs";
import type { SerializedVehicleRow } from "@/components/dashboard/vehicle-table";
import { TableSearch } from "@/components/dashboard/table-search";
import { Pagination } from "@/components/dashboard/pagination";
import { getPlanLimits } from "@/lib/plans";
import { applySpread, getCurrentUsdRate } from "@/lib/exchange-rate";
import { canSeeCosts } from "@/lib/permissions";
import { TableToolbar } from "@/components/dashboard/table-toolbar";
import {
  TableTransitionOverlay,
  TableTransitionProvider,
} from "@/components/dashboard/table-transition";
import {
  parsePage,
  resolveFilter,
  resolveSort,
  toClientSortOptions,
} from "@/lib/table/query-params";
import {
  buildVehicleWhere,
  hasActiveVehicleFilters,
  VEHICLE_CONDITION_FILTER,
  VEHICLE_FILTERS,
  VEHICLE_PUBLICATION_FILTER,
  VEHICLE_SORT,
  VEHICLE_STATUS_FILTER,
} from "@/lib/table/vehicle-table-params";

const PAGE_SIZE = 20;

/**
 * Stats absolutos del concesionario (no dependen de filtros ni de la página).
 *
 * Se invalidan con `revalidateTag("vehicles-stats")` desde todo handler que
 * mute vehículos — incluidos los de ventas, que sincronizan el status del
 * vehículo al reservar o vender.
 *
 * Un `groupBy` resuelve total/reservados/vendidos en UNA query en vez de tres
 * counts separados; publicados necesita la suya porque se deriva de `publishedAt`.
 */
const getCachedStats = unstable_cache(
  async (dealershipId: string) => {
    const [byStatus, totalPublished] = await Promise.all([
      prisma.vehicle.groupBy({
        by: ["status"],
        where: { dealershipId },
        _count: { _all: true },
      }),
      prisma.vehicle.count({ where: { dealershipId, publishedAt: { not: null } } }),
    ]);

    const countByStatus = new Map(byStatus.map((row) => [row.status, row._count._all]));
    const totalAll = byStatus.reduce((acc, row) => acc + row._count._all, 0);

    return {
      totalAll,
      totalPublished,
      totalReserved: countByStatus.get("reserved") ?? 0,
      totalSold: countByStatus.get("sold") ?? 0,
    };
  },
  ["vehicles-stats"],
  { tags: ["vehicles-stats"], revalidate: 3600 }
);

interface VehiculosPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    status?: string;
    published?: string;
    condition?: string;
    sort?: string;
  }>;
}

export default async function VehiculosPage({ searchParams }: VehiculosPageProps) {
  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/onboarding");

  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const page = parsePage(params.page);
  const skip = (page - 1) * PAGE_SIZE;

  // Filtros y orden se resuelven contra sus definiciones: lo que venga en la
  // URL fuera de la whitelist cae al default en vez de llegar a Prisma.
  const status = resolveFilter(params.status, VEHICLE_STATUS_FILTER);
  const published = resolveFilter(params.published, VEHICLE_PUBLICATION_FILTER);
  const condition = resolveFilter(params.condition, VEHICLE_CONDITION_FILTER);
  const sort = resolveSort(params.sort, VEHICLE_SORT);

  const where = buildVehicleWhere({
    dealershipId: dealership.id,
    search,
    status,
    published,
    condition,
  });

  const filtersActive = hasActiveVehicleFilters({ search, status, published, condition });

  // Costo y margen son datos sensibles: solo admins, o no-admins si el dealer lo
  // habilitó. Se resuelve ANTES de la query para no traer los gastos cuando no
  // se van a poder mostrar — antes se pedían siempre y se descartaban después.
  const canViewCosts = canSeeCosts(dealership.currentUser, dealership);

  // Sin filtros ni búsqueda, el total de la paginación es exactamente el
  // `totalAll` que ya viene cacheado: nos ahorramos un COUNT(*). Con filtros
  // activos el resultado depende de ellos y no se puede cachear, así que sí
  // corremos el count.
  const [stats, vehicles, filteredCount, baseRate] = await Promise.all([
    getCachedStats(dealership.id),
    prisma.vehicle.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        expenses: canViewCosts ? { select: { amount: true, currency: true } } : false,
      },
      skip,
      take: PAGE_SIZE,
      // Ya validado contra la whitelist de VEHICLE_SORT.
      orderBy: sort.orderBy,
    }),
    filtersActive ? prisma.vehicle.count({ where }) : Promise.resolve(0),
    getCurrentUsdRate(),
  ]);

  const { totalAll, totalPublished, totalReserved, totalSold } = stats;
  const total = filtersActive ? filteredCount : totalAll;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Cotización efectiva del dealer (oficial + spread) para convertir costos en USD.
  const usdRate = baseRate ? applySpread(baseRate, dealership.usdSpread).effective : null;

  // Serializar Decimal a string para poder pasar al Client Component.
  const serialized: SerializedVehicleRow[] = vehicles.map((v) => ({
    ...v,
    price: v.price.toString(),
    costPrice: canViewCosts && v.costPrice ? v.costPrice.toString() : null,
    costCurrency: canViewCosts ? v.costCurrency : null,
    // Si no puede ver costos, los gastos ni se pidieron a la DB.
    expenses: (v.expenses ?? []).map((e) => ({
      amount: Number(e.amount),
      currency: e.currency,
    })),
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
    publishedAt: v.publishedAt?.toISOString() ?? null,
    images: v.images.map((img) => ({ ...img })),
  }));

  const statCards = [
    { label: "Total", value: totalAll },
    { label: "Publicados", value: totalPublished },
    { label: "Reservados", value: totalReserved },
    { label: "Vendidos", value: totalSold },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vehículos</h1>
        <Button nativeButton={false} render={<Link href="/dashboard/vehiculos/nuevo" />}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar vehículo
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* El listado va como children del componente de solapas: se renderiza en
          el servidor y las solapas solo deciden cuál se muestra. */}
      <VehiclesTabs dealershipCurrency={dealership.currency}>
        {/* El provider comparte la transición entre la barra (que navega) y la
            tabla (que muestra el loader mientras llega el nuevo resultado). */}
        <TableTransitionProvider>
          <TableToolbar
            filters={VEHICLE_FILTERS}
            values={{
              [VEHICLE_STATUS_FILTER.param]: status,
              [VEHICLE_PUBLICATION_FILTER.param]: published,
              [VEHICLE_CONDITION_FILTER.param]: condition,
            }}
            sort={{
              param: VEHICLE_SORT.param,
              options: toClientSortOptions(VEHICLE_SORT),
              value: sort.value,
            }}
          >
            <TableSearch
              placeholder="Buscar por título, marca, modelo, patente o VIN..."
              ariaLabel="Buscar vehículos"
            />
          </TableToolbar>

          <TableTransitionOverlay>
            {serialized.length === 0 && filtersActive ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                <p className="font-medium text-muted-foreground">
                  {search ? <>Sin resultados para &ldquo;{search}&rdquo;</> : "Sin resultados"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Probá cambiando los filtros o limpiándolos para ver todo el stock.
                </p>
              </div>
            ) : (
              <VehicleTable
                vehicles={serialized}
                limits={getPlanLimits(dealership)}
                usdRate={usdRate}
                canViewCosts={canViewCosts}
              />
            )}

            {total > 0 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={PAGE_SIZE}
              />
            )}
          </TableTransitionOverlay>
        </TableTransitionProvider>
      </VehiclesTabs>
    </div>
  );
}
