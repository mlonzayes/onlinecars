import Link from "next/link";
import { Car, MessageSquare, Settings, ShoppingCart, Users, TrendingUp, Wallet } from "lucide-react";
import { getCurrentDealership } from "@/lib/auth";
import { getDashboardHomeData } from "@/lib/dashboard-cache";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SalesByMonthChart } from "@/components/dashboard/charts/sales-by-month-chart";
import { StockByStatusChart } from "@/components/dashboard/charts/stock-by-status-chart";
import { NetProfitByMonthChart } from "@/components/dashboard/charts/net-profit-by-month-chart";
import { StockByBrandChart } from "@/components/dashboard/charts/stock-by-brand-chart";
import { StockAgingChart } from "@/components/dashboard/charts/stock-aging-chart";

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

  // Métricas financieras: solo visibles para admins (revelan el costo/margen).
  const isAdmin = dealership.currentUser.role === "admin";
  const { grossRevenue, netProfit, revenueWithCost, salesCount, salesWithCost } =
    stats.financials;
  // Margen y neta solo tienen sentido sobre ventas con costo cargado.
  const hasCostData = salesWithCost > 0;
  const marginPct =
    hasCostData && revenueWithCost > 0
      ? Math.round((netProfit / revenueWithCost) * 100)
      : null;
  const marginNote = !hasCostData
    ? "Cargá el costo de tus ventas para verlo"
    : salesWithCost < salesCount
      ? `Sobre ${salesWithCost} de ${salesCount} ventas con costo cargado`
      : `Sobre ${salesCount} ${salesCount === 1 ? "venta" : "ventas"}`;

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

      {/* Resumen financiero — solo admins (datos sensibles de costo/margen). */}
      {isAdmin && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="size-4" />
                <CardDescription>Ingreso bruto · últimos 6 meses</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatCurrency(grossRevenue)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet className="size-4" />
                <CardDescription>Ganancia neta · últimos 6 meses</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-emerald-600">
                {hasCostData ? formatCurrency(netProfit) : "—"}
              </p>
              {!hasCostData && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Sin costos cargados
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Margen</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {marginPct !== null ? `${marginPct}%` : "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{marginNote}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts: 2 columnas en desktop, stack en mobile. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SalesByMonthChart data={stats.salesByMonth} />
        {/* Ganancia neta — solo admins (revela margen). */}
        {isAdmin && <NetProfitByMonthChart data={stats.netProfitByMonth} />}
        <StockByStatusChart data={stats.stockByStatus} />
        <StockByBrandChart data={stats.stockByBrand} />
      </div>

      {/* Antigüedad del stock — ancho completo, lee mejor extendido. */}
      <StockAgingChart data={stats.stockAging} />

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
