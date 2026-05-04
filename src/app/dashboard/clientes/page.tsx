import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomersTable } from "@/components/dashboard/customers-table";

export default async function ClientesPage() {
  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/onboarding");

  const customers = await prisma.customer.findMany({
    where: { dealershipId: dealership.id },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: customers.length,
    individuals: customers.filter((c) => c.type === "individual").length,
    companies: customers.filter((c) => c.type === "company").length,
  };

  const statCards = [
    { label: "Total", value: stats.total },
    { label: "Particulares", value: stats.individuals },
    { label: "Empresas", value: stats.companies },
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

      <CustomersTable customers={customers} />
    </div>
  );
}
