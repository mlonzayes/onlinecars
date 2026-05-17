import Link from "next/link";
import { Car, MessageSquare, Settings, ShoppingCart, Users } from "lucide-react";
import { getCurrentDealership } from "@/lib/auth";
import { getDashboardHomeData } from "@/lib/dashboard-cache";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SalesByMonthChart } from "@/components/dashboard/charts/sales-by-month-chart";
import { LeadsBySourceChart } from "@/components/dashboard/charts/leads-by-source-chart";
import { StockByStatusChart } from "@/components/dashboard/charts/stock-by-status-chart";
import { ConversionFunnelChart } from "@/components/dashboard/charts/conversion-funnel-chart";

export default async function DashboardHomePage() {
  const dealership = await getCurrentDealership();
  if (!dealership) return null;

  const {
    stats,
    vehicleCount,
    leadCount,
    newLeadCount,
    customerCount,
    activeSaleCount,
  } = await getDashboardHomeData(dealership.id);

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

      {/* Charts: 2x2 en desktop, stack en mobile. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SalesByMonthChart data={stats.salesByMonth} />
        <ConversionFunnelChart data={stats.funnel} />
        <LeadsBySourceChart data={stats.leadsBySource} />
        <StockByStatusChart data={stats.stockByStatus} />
      </div>

      {/* Cards de navegación rápida. */}
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
