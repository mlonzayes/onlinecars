import Link from "next/link";
import { Car, MessageSquare, Settings, ShoppingCart, Users } from "lucide-react";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardHomePage() {
  const dealership = await getCurrentDealership();
  if (!dealership) return null;

  const [vehicleCount, leadCount, newLeadCount, customerCount, activeSaleCount] = await Promise.all([
    prisma.vehicle.count({ where: { dealershipId: dealership.id } }),
    prisma.lead.count({ where: { dealershipId: dealership.id } }),
    prisma.lead.count({
      where: { dealershipId: dealership.id, status: "new" },
    }),
    prisma.customer.count({ where: { dealershipId: dealership.id } }),
    prisma.sale.count({
      where: {
        dealershipId: dealership.id,
        status: { in: ["draft", "reserved", "in_progress"] },
      },
    }),
  ]);

  const sections = [
    {
      label: "Vehículos",
      description: "Gestioná el catálogo de tu concesionario",
      href: "/dashboard/vehiculos",
      icon: Car,
      stat: `${vehicleCount} en stock`,
    },
    {
      label: "Clientes",
      description: "Personas y empresas que operaron con vos",
      href: "/dashboard/clientes",
      icon: Users,
      stat: `${customerCount} registrados`,
    },
    {
      label: "Ventas",
      description: "Operaciones de compraventa activas y cerradas",
      href: "/dashboard/ventas",
      icon: ShoppingCart,
      stat: `${activeSaleCount} en curso`,
    },
    {
      label: "Leads",
      description: "Consultas de clientes interesados",
      href: "/dashboard/leads",
      icon: MessageSquare,
      stat: `${leadCount} totales · ${newLeadCount} nuevos`,
    },
    {
      label: "Configuración",
      description: "Datos de contacto y branding del sitio",
      href: "/dashboard/configuracion",
      icon: Settings,
      stat: dealership.slug,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Hola, {dealership.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Resumen general de tu concesionario.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className="group">
            <Card className="h-full transition-colors group-hover:bg-accent/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <section.icon className="size-5" />
                  </div>
                  <div className="flex flex-col">
                    <CardTitle>{section.label}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{section.stat}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
