import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomersTable } from "@/components/dashboard/customers-table";
import { CustomerSearch } from "@/components/dashboard/customer-search";
import { Pagination } from "@/components/dashboard/pagination";
import type { Prisma } from "@prisma/client";

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

  // Stats absolutos del dealership (independientes del search/page) en paralelo
  // con la query paginada del listado. Tres counts livianos.
  const [total, customers, totalAll, totalIndividuals, totalCompanies] =
    await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: PAGE_SIZE,
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.count({ where: { dealershipId: dealership.id } }),
      prisma.customer.count({
        where: { dealershipId: dealership.id, type: "individual" },
      }),
      prisma.customer.count({
        where: { dealershipId: dealership.id, type: "company" },
      }),
    ]);

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

      <CustomerSearch />

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
        <CustomersTable customers={customers} />
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
