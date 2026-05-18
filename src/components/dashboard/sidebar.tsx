"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calculator,
  Car,
  CreditCard,
  Globe,
  Landmark,
  LayoutDashboard,
  MessageSquare,
  Receipt,
  Settings,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { DealershipWithUser } from "@/lib/auth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  // null = grupo sin header visible (típicamente el primero con Dashboard).
  label: string | null;
  items: NavItem[];
}

// Agrupado por dominio. Comercial sigue el flujo del negocio: stock → consulta →
// cliente → operación → financiación. Footer queda para acciones de admin.
const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Comercial",
    items: [
      { label: "Vehículos", href: "/dashboard/vehiculos", icon: Car },
      { label: "Leads", href: "/dashboard/leads", icon: MessageSquare },
      { label: "Clientes", href: "/dashboard/clientes", icon: Users },
      { label: "Ventas", href: "/dashboard/ventas", icon: ShoppingCart },
      { label: "Cotizaciones", href: "/dashboard/cotizaciones", icon: Calculator },
    ],
  },
  {
    label: "Sitio público",
    items: [
      { label: "Sitio Web", href: "/dashboard/sitio-web", icon: Globe },
      { label: "Portales", href: "/dashboard/portales", icon: Store },
    ],
  },
  {
    label: "Finanzas",
    items: [
      { label: "Pagos", href: "/dashboard/pagos", icon: CreditCard },
      { label: "Bancos", href: "/dashboard/bancos", icon: Landmark },
      { label: "Contabilidad", href: "/dashboard/contabilidad", icon: Receipt },
    ],
  },
];

interface DashboardSidebarProps {
  dealership: DealershipWithUser;
}

export function DashboardSidebar({ dealership }: DashboardSidebarProps) {
  const pathname = usePathname();

  function isItemActive(href: string): boolean {
    return href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center justify-center px-2 py-2">
          <Image
            src="/logo/motorflow_light.png"
            alt="motorflow"
            width={140}
            height={32}
            className="h-8 w-auto object-contain dark:hidden"
            priority
          />
          <Image
            src="/logo/motorflow_dark.png"
            alt="motorflow"
            width={140}
            height={32}
            className="hidden h-8 w-auto object-contain dark:block"
            priority
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group, groupIdx) => (
          <SidebarGroup key={group.label ?? `group-${groupIdx}`}>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isItemActive(item.href)}
                    render={<Link href={item.href} />}
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {/* Vendedores: solo visible para el admin. */}
          {dealership.currentUser.role === "admin" && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/dashboard/vendedores")}
                render={<Link href="/dashboard/vendedores" />}
              >
                <Users className="size-4" />
                <span>Vendedores</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname.startsWith("/dashboard/configuracion")}
              render={<Link href="/dashboard/configuracion" />}
            >
              <Settings className="size-4" />
              <span>Configuración</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex items-center gap-3 px-2 py-2">
          <UserButton />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium truncate">{dealership.name}</span>
            <span className="text-xs text-muted-foreground truncate">
              {dealership.currentUser.role}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
