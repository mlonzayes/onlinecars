"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, LayoutDashboard, MessageSquare, Settings } from "lucide-react";
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

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Vehículos", href: "/dashboard/vehiculos", icon: Car },
  { label: "Leads", href: "/dashboard/leads", icon: MessageSquare },
  { label: "Configuración", href: "/dashboard/configuracion", icon: Settings },
];

interface DashboardSidebarProps {
  dealership: DealershipWithUser;
}

export function DashboardSidebar({ dealership }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <Car className="size-5 text-blue-500 shrink-0" />
          <span className="font-semibold text-sm truncate">{dealership.name}</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-3 px-2 py-2">
          <UserButton afterSignOutUrl="/" />
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
