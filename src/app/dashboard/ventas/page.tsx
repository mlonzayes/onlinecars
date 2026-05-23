import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesTable } from "@/components/dashboard/sales-table";
import type {
  SaleRow,
  SalesStatusFilter,
} from "@/components/dashboard/sales-table";
import { SalesStatusSelect } from "@/components/dashboard/sales-status-select";
import { TableSearch } from "@/components/dashboard/table-search";
import { Pagination } from "@/components/dashboard/pagination";
import { getPlanLimits } from "@/lib/plans";

const PAGE_SIZE = 20;

// Stats absolutos (sin search). Cacheamos los 4 counts en un solo round-trip;
// se invalidan vía revalidateTag("sales-stats") en los endpoints que mutan
// ventas (POST, PATCH, DELETE, status).
const getCachedStats = unstable_cache(
  async (dealershipId: string) => {
    const [total, active, completed, cancelled] = await Promise.all([
      prisma.sale.count({ where: { dealershipId } }),
      prisma.sale.count({
        where: {
          dealershipId,
          status: { in: ["draft", "reserved", "in_progress"] },
        },
      }),
      prisma.sale.count({ where: { dealershipId, status: "completed" } }),
      prisma.sale.count({ where: { dealershipId, status: "cancelled" } }),
    ]);
    return { total, active, completed, cancelled };
  },
  ["sales-stats"],
  { tags: ["sales-stats"], revalidate: 3600 }
);

const STATUS_FILTERS = ["all", "active", "completed", "cancelled"] as const;

function parseStatusFilter(raw: string | undefined): SalesStatusFilter {
  if (raw && (STATUS_FILTERS as readonly string[]).includes(raw)) {
    return raw as SalesStatusFilter;
  }
  return "all";
}

function parsePage(raw: string | undefined): number {
  if (!raw) return 1;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

// Traduce el tab activo a un fragmento de WHERE de Prisma.
function statusFilterToWhere(
  filter: SalesStatusFilter
): Prisma.SaleWhereInput {
  switch (filter) {
    case "active":
      return { status: { in: ["draft", "reserved", "in_progress"] } };
    case "completed":
      return { status: "completed" };
    case "cancelled":
      return { status: "cancelled" };
    default:
      return {};
  }
}

interface VentasPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    status?: string;
  }>;
}

export default async function VentasPage({ searchParams }: VentasPageProps) {
  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/onboarding");

  const { q, page: pageParam, status: statusParam } = await searchParams;
  const search = q?.trim() ?? "";
  const page = parsePage(pageParam);
  const statusFilter = parseStatusFilter(statusParam);
  const skip = (page - 1) * PAGE_SIZE;

  // Tokenizamos por espacios y exigimos AND de matches en algún campo.
  // Buscamos en customer (nombre/apellido/razón social/documento) y en
  // vehicle (título/marca/modelo/patente).
  const tokens = search.split(/\s+/).filter(Boolean);
  const hasSearch = tokens.length > 0;

  const where: Prisma.SaleWhereInput = {
    dealershipId: dealership.id,
    ...statusFilterToWhere(statusFilter),
    ...(hasSearch
      ? {
          AND: tokens.map((token) => ({
            OR: [
              {
                customer: {
                  firstName: { contains: token, mode: "insensitive" as const },
                },
              },
              {
                customer: {
                  lastName: { contains: token, mode: "insensitive" as const },
                },
              },
              {
                customer: {
                  businessName: {
                    contains: token,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                customer: { documentNumber: { contains: token } },
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

  // Sin search, el count del paginador se deriva del cached stats (mismo
  // valor para "all"; para los demás filtros, mapeamos al stat correspondiente).
  // Con search, sí corremos el count porque depende de los tokens.
  const [stats, sales, searchCount] = await Promise.all([
    getCachedStats(dealership.id),
    prisma.sale.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        customer: {
          select: {
            id: true,
            type: true,
            firstName: true,
            lastName: true,
            businessName: true,
            documentType: true,
            documentNumber: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            title: true,
            brand: true,
            model: true,
            year: true,
            licensePlate: true,
          },
        },
      },
    }),
    hasSearch ? prisma.sale.count({ where }) : Promise.resolve(0),
  ]);

  const statForTab = (f: SalesStatusFilter): number => {
    switch (f) {
      case "active":
        return stats.active;
      case "completed":
        return stats.completed;
      case "cancelled":
        return stats.cancelled;
      default:
        return stats.total;
    }
  };

  const total = hasSearch ? searchCount : statForTab(statusFilter);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Serializar Decimal/Date para el Client Component.
  const serializedSales: SaleRow[] = sales.map((s) => ({
    id: s.id,
    status: s.status,
    salePrice: s.salePrice.toString(),
    currency: s.currency,
    createdAt: s.createdAt.toISOString(),
    customer: s.customer,
    vehicle: s.vehicle,
  }));

  const statCards = [
    { label: "Total", value: stats.total },
    { label: "En curso", value: stats.active },
    { label: "Completadas", value: stats.completed },
    { label: "Canceladas", value: stats.cancelled },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ventas</h1>
        <Button
          nativeButton={false}
          render={<Link href="/dashboard/ventas/nueva" />}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva venta
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <TableSearch
            placeholder="Buscar por cliente, documento, marca, modelo o patente..."
            ariaLabel="Buscar ventas"
          />
        </div>
        <SalesStatusSelect value={statusFilter} />
      </div>

      <SalesTable
        sales={serializedSales}
        statusFilter={statusFilter}
        searchActive={hasSearch}
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
