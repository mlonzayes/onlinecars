import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleTable } from "@/components/dashboard/vehicle-table";
import type { SerializedVehicleRow } from "@/components/dashboard/vehicle-table";

export default async function VehiculosPage() {
  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/onboarding");

  const vehicles = await prisma.vehicle.findMany({
    where: { dealershipId: dealership.id },
    include: { images: { where: { isPrimary: true }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  // Serializar Decimal a string para poder pasar al Client Component
  const serialized: SerializedVehicleRow[] = vehicles.map((v) => ({
    ...v,
    price: v.price.toString(),
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
    publishedAt: v.publishedAt?.toISOString() ?? null,
    images: v.images.map((img) => ({ ...img })),
  }));

  const stats = {
    total: vehicles.length,
    published: vehicles.filter((v) => v.publishedAt !== null).length,
    reserved: vehicles.filter((v) => v.status === "reserved").length,
    sold: vehicles.filter((v) => v.status === "sold").length,
  };

  const statCards = [
    { label: "Total", value: stats.total },
    { label: "Publicados", value: stats.published },
    { label: "Reservados", value: stats.reserved },
    { label: "Vendidos", value: stats.sold },
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

      <VehicleTable vehicles={serialized} />
    </div>
  );
}
