import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleTable } from "@/components/dashboard/vehicle-table";
import type { SerializedVehicleRow } from "@/components/dashboard/vehicle-table";
import { TableSearch } from "@/components/dashboard/table-search";
import { Pagination } from "@/components/dashboard/pagination";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 20;

interface VehiculosPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

function parsePage(raw: string | undefined): number {
  if (!raw) return 1;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function VehiculosPage({ searchParams }: VehiculosPageProps) {
  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/onboarding");

  const { q, page: pageParam } = await searchParams;
  const search = q?.trim() ?? "";
  const page = parsePage(pageParam);
  const skip = (page - 1) * PAGE_SIZE;

  // Tokenizamos por espacios y exigimos AND de matches en algún campo de texto.
  const tokens = search.split(/\s+/).filter(Boolean);

  const where: Prisma.VehicleWhereInput = {
    dealershipId: dealership.id,
    ...(tokens.length > 0
      ? {
          AND: tokens.map((token) => ({
            OR: [
              { title: { contains: token, mode: "insensitive" as const } },
              { brand: { contains: token, mode: "insensitive" as const } },
              { model: { contains: token, mode: "insensitive" as const } },
              { licensePlate: { contains: token, mode: "insensitive" as const } },
              { vin: { contains: token, mode: "insensitive" as const } },
            ],
          })),
        }
      : {}),
  };

  // Stats absolutos del dealership (independientes del search/page) en paralelo
  // con la query paginada del listado.
  const [total, vehicles, totalAll, totalPublished, totalReserved, totalSold] =
    await Promise.all([
      prisma.vehicle.count({ where }),
      prisma.vehicle.findMany({
        where,
        include: { images: { where: { isPrimary: true }, take: 1 } },
        skip,
        take: PAGE_SIZE,
        orderBy: { createdAt: "desc" },
      }),
      prisma.vehicle.count({ where: { dealershipId: dealership.id } }),
      prisma.vehicle.count({
        where: { dealershipId: dealership.id, publishedAt: { not: null } },
      }),
      prisma.vehicle.count({
        where: { dealershipId: dealership.id, status: "reserved" },
      }),
      prisma.vehicle.count({
        where: { dealershipId: dealership.id, status: "sold" },
      }),
    ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Serializar Decimal a string para poder pasar al Client Component.
  const serialized: SerializedVehicleRow[] = vehicles.map((v) => ({
    ...v,
    price: v.price.toString(),
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

      <TableSearch
        placeholder="Buscar por título, marca, modelo, patente o VIN..."
        ariaLabel="Buscar vehículos"
      />

      {serialized.length === 0 && search ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="font-medium text-muted-foreground">
            Sin resultados para &ldquo;{search}&rdquo;
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Probá con otra marca, modelo o patente.
          </p>
        </div>
      ) : (
        <VehicleTable vehicles={serialized} />
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
