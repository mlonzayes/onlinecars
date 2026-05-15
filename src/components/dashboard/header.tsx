"use client";

import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { UserButton } from "@clerk/nextjs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const SECTION_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/vehiculos": "Vehículos",
  "/dashboard/leads": "Leads",
  "/dashboard/configuracion": "Configuración",
  "/dashboard/perfil": "Perfil",
};

function getSectionLabel(pathname: string): string {
  // Exact match first
  if (SECTION_LABELS[pathname]) return SECTION_LABELS[pathname];

  // Prefix match para rutas anidadas (ej: /dashboard/vehiculos/nuevo)
  const match = Object.keys(SECTION_LABELS)
    .filter((key) => key !== "/dashboard" && pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];

  return match ? SECTION_LABELS[match] : "Dashboard";
}

interface DashboardHeaderProps {
  dealershipName: string;
}

export function DashboardHeader({ dealershipName }: DashboardHeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const sectionLabel = getSectionLabel(pathname);

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />

      {/* Breadcrumb: dealership / sección */}
      <nav className="flex flex-1 items-center gap-2 text-sm">
        <span className="font-semibold text-foreground truncate">{dealershipName}</span>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-muted-foreground truncate">{sectionLabel}</span>
      </nav>

      {/* Acciones del header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Cambiar tema"
          className="size-8"
        >
          <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </Button>

        <UserButton />
      </div>
    </header>
  );
}
