import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesTable } from "@/components/dashboard/sales-table";

export default async function VentasPage() {
  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/onboarding");

  const sales = await prisma.sale.findMany({
    where: { dealershipId: dealership.id },
    orderBy: { createdAt: "desc" },
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
        },
      },
    },
  });

  const stats = {
    total: sales.length,
    active: sales.filter((s) => ["draft", "reserved", "in_progress"].includes(s.status)).length,
    completed: sales.filter((s) => s.status === "completed").length,
    cancelled: sales.filter((s) => s.status === "cancelled").length,
  };

  const statCards = [
    { label: "Total", value: stats.total },
    { label: "En curso", value: stats.active },
    { label: "Completadas", value: stats.completed },
    { label: "Canceladas", value: stats.cancelled },
  ];

  // Serializar los Decimal de Prisma a string para el Client Component
  const serializedSales = sales.map((s) => ({
    ...s,
    salePrice: s.salePrice.toString(),
    depositAmount: s.depositAmount?.toString() ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    depositDate: s.depositDate?.toISOString() ?? null,
    invoiceDate: s.invoiceDate?.toISOString() ?? null,
    deliveryDate: s.deliveryDate?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ventas</h1>
        <Button nativeButton={false} render={<Link href="/dashboard/ventas/nueva" />}>
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

      <SalesTable sales={serializedSales} />
    </div>
  );
}
