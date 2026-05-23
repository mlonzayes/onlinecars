import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomersTable } from "@/components/dashboard/customers-table";
import { TableSearch } from "@/components/dashboard/table-search";
import { Pagination } from "@/components/dashboard/pagination";
import { getPlanLimits } from "@/lib/plans";
import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

const getCachedStats = unstable_cache(
  async (dealershipId: string) => {
    const [totalAll, totalIndividuals, totalCompanies] = await Promise.all([
      prisma.customer.count({ where: { dealershipId } }),
      prisma.customer.count({ where: { dealershipId, type: "individual" } }),
      prisma.customer.count({ where: { dealershipId, type: "company" } }),
    ]);
    return { totalAll, totalIndividuals, totalCompanies };
  },
  ["customers-stats"],
  { tags: ["customers-stats"], revalidate: 3600 }
);

const PAGE_SIZE = 20;

interface ClientesPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

function parsePage(raw: string | undefined): number {
  if (!raw) return 1;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function ClientesPage({ searchParams }: ClientesPageProps) {
  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/onboarding");

  const { q, page: pageParam } = await searchParams;
  const search = q?.trim() ?? "";
  const page = parsePage(pageParam);
  const skip = (page - 1) * PAGE_SIZE;

  // Tokenizamos la búsqueda por espacios y exigimos que TODAS las palabras
  // matcheen en algún campo. Sin esto, "mateo lonzayes" no encuentra a nadie
  // porque el firstName="Mateo" y el lastName="Lonzayes" están en columnas
  // distintas — un contains con el string completo nunca matchea.
  const tokens = search.split(/\s+/).filter(Boolean);

  const where: Prisma.CustomerWhereInput = {
    dealershipId: dealership.id,
    ...(tokens.length > 0
      ? {
          AND: tokens.map((token) => ({
            OR: [
              { firstName: { contains: token, mode: "insensitive" as const } },
              { lastName: { contains: token, mode: "insensitive" as const } },
              { businessName: { contains: token, mode: "insensitive" as const } },
              { documentNumber: { contains: token } },
              { email: { contains: token, mode: "insensitive" as const } },
            ],
          })),
        }
      : {}),
  };

  const hasSearch = tokens.length > 0;

  // Sin búsqueda, `total` es exactamente lo mismo que `stats.totalAll` (que
  // está cacheado en Redis vía unstable_cache). Evitamos el COUNT(*) extra y
  // lo derivamos del cache. Con búsqueda activa, sí lo corremos porque el
  // resultado depende de los tokens y no se puede cachear.
  const [stats, customers, searchCount] = await Promise.all([
    getCachedStats(dealership.id),
    prisma.customer.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
    }),
    hasSearch ? prisma.customer.count({ where }) : Promise.resolve(0),
  ]);

  const { totalAll, totalIndividuals, totalCompanies } = stats;
  const total = hasSearch ? searchCount : totalAll;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const statCards = [
    { label: "Total", value: totalAll },
    { label: "Particulares", value: totalIndividuals },
    { label: "Empresas", value: totalCompanies },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button nativeButton={false} render={<Link href="/dashboard/clientes/nuevo" />}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar cliente
        </Button>
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

      <TableSearch
        placeholder="Buscar por nombre, documento o email..."
        ariaLabel="Buscar clientes"
      />

      {customers.length === 0 && search ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="font-medium text-muted-foreground">
            Sin resultados para &ldquo;{search}&rdquo;
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Probá con otro nombre, documento o email.
          </p>
        </div>
      ) : (
        <CustomersTable customers={customers} limits={getPlanLimits(dealership)} />
      )}

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
