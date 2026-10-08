import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getPlanLimits } from "@/lib/plans";
import { canWrite } from "@/lib/permissions";
import { getAccountInfo } from "@/lib/mercadolibre/token-store";
import { getMLPacksOverview, type MLPacksOverview } from "@/lib/mercadolibre/packs";
import { MLPacksSummary } from "@/components/dashboard/ml-packs-summary";
import {
  MLPackVehiclesTable,
  type MLPackVehicleRow,
} from "@/components/dashboard/ml-pack-vehicles-table";
import { TableSearch } from "@/components/dashboard/table-search";
import { TableToolbar } from "@/components/dashboard/table-toolbar";
import { Pagination } from "@/components/dashboard/pagination";
import {
  TableTransitionOverlay,
  TableTransitionProvider,
} from "@/components/dashboard/table-transition";
import {
  isFilterActive,
  parsePage,
  resolveFilter,
  resolveSort,
  toClientSortOptions,
} from "@/lib/table/query-params";
import {
  buildMLVehicleWhere,
  ML_STATE_FILTER,
  ML_VEHICLE_FILTERS,
  ML_VEHICLE_SORT,
} from "@/lib/table/ml-vehicle-table-params";

const PAGE_SIZE = 20;

interface MercadoLibrePageProps {
  searchParams: Promise<{ q?: string; page?: string; ml?: string; sort?: string }>;
}

export default async function MercadoLibrePacksPage({ searchParams }: MercadoLibrePageProps) {
  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/sign-in");

  const limits = getPlanLimits(dealership);
  // Sin plan o sin cuenta conectada, la página de Portales ya explica qué hacer.
  if (!limits.allowMLIntegration) redirect("/dashboard/portales");
  const account = await getAccountInfo(dealership.id);
  if (!account) redirect("/dashboard/portales");

  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const page = parsePage(params.page);
  const mlState = resolveFilter(params.ml, ML_STATE_FILTER);
  const sort = resolveSort(params.sort, ML_VEHICLE_SORT);
  const filtersActive = search.length > 0 || isFilterActive(mlState);

  const where = buildMLVehicleWhere({ dealershipId: dealership.id, search, mlState });

  // Si ML falla, mostramos el stock igual: el dealer puede publicar sin ver el cupo.
  const packsPromise: Promise<MLPacksOverview | null> = getMLPacksOverview(
    dealership.id,
    account.mlUserId
  ).catch((err: unknown) => {
    logger.error(undefined, "ml.packs.fetch_failed", {
      dealershipId: dealership.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  });

  const [overview, vehicles, total] = await Promise.all([
    packsPromise,
    prisma.vehicle.findMany({
      where,
      orderBy: sort.orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        brand: true,
        model: true,
        year: true,
        licensePlate: true,
        price: true,
        currency: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        mlListing: { select: { status: true, listingTypeId: true, permalink: true } },
      },
    }),
    prisma.vehicle.count({ where }),
  ]);

  const rows: MLPackVehicleRow[] = vehicles.map((v) => ({
    id: v.id,
    title: v.title,
    brand: v.brand,
    model: v.model,
    year: v.year,
    licensePlate: v.licensePlate,
    price: v.price.toString(),
    currency: v.currency,
    imageUrl: v.images[0]?.url ?? null,
    listing: v.mlListing,
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/dashboard/portales"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Portales
        </Link>
        <h1 className="text-2xl font-bold">Mercado Libre</h1>
        <p className="text-muted-foreground">
          Usá los lugares de tus paquetes para publicar y destacar tu stock
          {account.nickname ? ` en la cuenta ${account.nickname}` : ""}.
        </p>
      </div>

      <MLPacksSummary overview={overview} />

      <TableTransitionProvider>
        <TableToolbar
          filters={ML_VEHICLE_FILTERS}
          values={{ [ML_STATE_FILTER.param]: mlState }}
          sort={{
            param: ML_VEHICLE_SORT.param,
            options: toClientSortOptions(ML_VEHICLE_SORT),
            value: sort.value,
          }}
        >
          <TableSearch
            placeholder="Buscar por marca, modelo o patente..."
            ariaLabel="Buscar vehículos para Mercado Libre"
          />
        </TableToolbar>

        <TableTransitionOverlay>
          <MLPackVehiclesTable
            rows={rows}
            filtersActive={filtersActive}
            publicationsRemaining={overview?.publicationsRemaining ?? null}
            upgradesRemaining={overview?.upgradesRemaining ?? {}}
            canEdit={canWrite(dealership.currentUser)}
            allowBulk={limits.allowBulkActions}
          />
          {total > 0 && (
            <Pagination
              currentPage={page}
              totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
              totalItems={total}
              pageSize={PAGE_SIZE}
            />
          )}
        </TableTransitionOverlay>
      </TableTransitionProvider>
    </div>
  );
}
