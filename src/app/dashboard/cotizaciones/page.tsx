import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QuotationsTable } from "@/components/dashboard/quotations-table";
import type { QuotationRow } from "@/components/dashboard/quotations-table";
import { QuotationsFilters } from "@/components/dashboard/quotations-filters";
import { TableSearch } from "@/components/dashboard/table-search";
import { Pagination } from "@/components/dashboard/pagination";
import { getPlanLimits } from "@/lib/plans";
import {
  QUOTATION_STATUSES,
  QUOTATION_TYPES,
  type QuotationStatus,
  type QuotationType,
} from "@/lib/constants";
import {
  decorateWithExpired,
  effectiveStatusFilter,
} from "@/lib/quotation-status";

const PAGE_SIZE = 20;

// Stats absolutos (sin filtros). Se invalidan vía revalidateTag("quotations-stats")
// en los endpoints de mutación (POST/PATCH/DELETE/status).
const getCachedStats = unstable_cache(
  async (dealershipId: string) => {
    const now = new Date();
    const [total, pendingActive, accepted] = await Promise.all([
      prisma.quotation.count({ where: { dealershipId } }),
      prisma.quotation.count({
        where: { dealershipId, status: "pending", validUntil: { gte: now } },
      }),
      prisma.quotation.count({
        where: { dealershipId, status: "accepted" },
      }),
    ]);
    return { total, pendingActive, accepted };
  },
  ["quotations-stats"],
  { tags: ["quotations-stats"], revalidate: 3600 }
);

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parseType(value: string | undefined): QuotationType | "all" {
  if (value && (QUOTATION_TYPES as readonly string[]).includes(value)) {
    return value as QuotationType;
  }
  return "all";
}

function parseStatus(value: string | undefined): QuotationStatus | "all" {
  if (value && (QUOTATION_STATUSES as readonly string[]).includes(value)) {
    return value as QuotationStatus;
  }
  return "all";
}

function parsePage(raw: string | undefined): number {
  if (!raw) return 1;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function CotizacionesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/onboarding");

  const sp = await searchParams;
  const search = typeof sp.q === "string" ? sp.q.trim() : "";
  const selectedType = parseType(
    typeof sp.type === "string" ? sp.type : undefined
  );
  const selectedStatus = parseStatus(
    typeof sp.status === "string" ? sp.status : undefined
  );
  const page = parsePage(typeof sp.page === "string" ? sp.page : undefined);
  const skip = (page - 1) * PAGE_SIZE;

  const tokens = search.split(/\s+/).filter(Boolean);
  const hasSearch = tokens.length > 0;
  const hasFilters =
    hasSearch || selectedType !== "all" || selectedStatus !== "all";

  const where: Prisma.QuotationWhereInput = {
    dealershipId: dealership.id,
    ...(selectedType !== "all" ? { type: selectedType } : {}),
    ...effectiveStatusFilter(
      selectedStatus !== "all" ? selectedStatus : undefined
    ),
    ...(hasSearch
      ? {
          AND: tokens.map((token) => ({
            OR: [
              { code: { contains: token, mode: "insensitive" as const } },
              {
                saleClientName: {
                  contains: token,
                  mode: "insensitive" as const,
                },
              },
              {
                purchaseSellerName: {
                  contains: token,
                  mode: "insensitive" as const,
                },
              },
              {
                purchaseBrand: {
                  contains: token,
                  mode: "insensitive" as const,
                },
              },
              {
                purchaseModel: {
                  contains: token,
                  mode: "insensitive" as const,
                },
              },
              {
                vehicle: {
                  title: { contains: token, mode: "insensitive" as const },
                },
              },
              {
                vehicle: {
                  brand: { contains: token, mode: "insensitive" as const },
                },
              },
              {
                vehicle: {
                  model: { contains: token, mode: "insensitive" as const },
                },
              },
              {
                vehicle: {
                  licensePlate: {
                    contains: token,
                    mode: "insensitive" as const,
                  },
                },
              },
            ],
          })),
        }
      : {}),
  };

  // Cuando NO hay filtros, el count del paginador equivale a stats.total (cache).
  // Cuando SÍ hay filtros (search, type o status), corremos count específico.
  const [stats, quotations, filteredCount] = await Promise.all([
    getCachedStats(dealership.id),
    prisma.quotation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        type: true,
        code: true,
        status: true,
        currency: true,
        validUntil: true,
        emittedAt: true,
        createdAt: true,
        saleClientName: true,
        saleTotalPrice: true,
        purchaseSellerName: true,
        purchaseOfferAmount: true,
        vehicle: {
          select: {
            id: true,
            title: true,
            brand: true,
            model: true,
            year: true,
          },
        },
        lead: { select: { id: true, name: true } },
      },
    }),
    hasFilters ? prisma.quotation.count({ where }) : Promise.resolve(0),
  ]);

  const total = hasFilters ? filteredCount : stats.total;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Serializar Decimal/Date para el Client Component.
  const rows: QuotationRow[] = quotations.map((q) => {
    const decorated = decorateWithExpired(q);
    return {
      id: q.id,
      type: q.type as QuotationType,
      code: q.code,
      status: q.status,
      effectiveStatus: decorated.effectiveStatus,
      currency: q.currency,
      validUntil: q.validUntil.toISOString(),
      emittedAt: q.emittedAt.toISOString(),
      createdAt: q.createdAt.toISOString(),
      saleClientName: q.saleClientName,
      saleTotalPrice: q.saleTotalPrice?.toString() ?? null,
      purchaseSellerName: q.purchaseSellerName,
      purchaseOfferAmount: q.purchaseOfferAmount?.toString() ?? null,
      vehicle: q.vehicle ?? null,
      lead: q.lead ?? null,
    };
  });

  const statCards = [
    { label: "Total", value: stats.total },
    { label: "Pendientes activas", value: stats.pendingActive },
    { label: "Aceptadas", value: stats.accepted },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cotizaciones</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/dashboard/cotizaciones/nueva-compra" />}
          >
            <Plus className="mr-2 h-4 w-4" />
            Compra
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/dashboard/cotizaciones/nueva-venta" />}
          >
            <Plus className="mr-2 h-4 w-4" />
            Venta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <TableSearch
            placeholder="Buscar por código, contraparte, marca, modelo o patente..."
            ariaLabel="Buscar cotizaciones"
          />
        </div>
        <QuotationsFilters type={selectedType} status={selectedStatus} />
      </div>

      <QuotationsTable
        rows={rows}
        searchActive={hasFilters}
        limits={getPlanLimits(dealership)}
      />

      {total > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={PAGE_SIZE}
        />
      )}
    </div>
  );
}
