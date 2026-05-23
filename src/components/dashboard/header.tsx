"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { UserButton } from "@clerk/nextjs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

// Labels por segmento de URL. Los segmentos no listados acá caen en
// resolveSegmentLabel() con un fallback razonable (ej: cuids → "Detalle").
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  vehiculos: "Vehículos",
  leads: "Leads",
  clientes: "Clientes",
  ventas: "Ventas",
  cotizaciones: "Cotizaciones",
  configuracion: "Configuración",
  perfil: "Perfil",
  "sitio-web": "Sitio web",
  portales: "Portales",
  vendedores: "Vendedores",
  nueva: "Nueva",
  nuevo: "Nuevo",
  "nueva-venta": "Nueva venta",
  "nueva-compra": "Nueva compra",
};

// cuids tipo "cmpeoxjbv0001i4mqopa10cxg" — los reconocemos para mostrar
// "Detalle" en vez del ID crudo. Si en el futuro queremos mostrar el código
// real (ej: VTA-00001), cada page puede pasar un label via context.
function isLikelyId(segment: string): boolean {
  return /^c[a-z0-9]{20,}$/i.test(segment);
}

function resolveSegmentLabel(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  if (isLikelyId(segment)) return "Detalle";
  // Fallback: capitalizar el segmento crudo para que no quede tipo "foo-bar"
  return segment
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

interface Crumb {
  label: string;
  href: string | null; // null = es el segmento actual, no clickeable
}

function buildBreadcrumbs(pathname: string): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];
  let acc = "";
  for (let i = 0; i < parts.length; i++) {
    acc += `/${parts[i]}`;
    const isLast = i === parts.length - 1;
    crumbs.push({
      label: resolveSegmentLabel(parts[i]),
      href: isLast ? null : acc,
    });
  }
  return crumbs;
}

interface DashboardHeaderProps {
  dealershipName: string;
}

export function DashboardHeader({ dealershipName }: DashboardHeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const breadcrumbs = buildBreadcrumbs(pathname);

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />

      {/* Breadcrumb: dealership / segmento / segmento ... */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-1 items-center gap-2 text-sm min-w-0"
      >
        <span className="font-semibold text-foreground truncate shrink-0">
          {dealershipName}
        </span>
        {breadcrumbs.map((crumb, i) => (
          <Fragment key={`${i}-${crumb.label}`}>
            <span className="text-muted-foreground shrink-0">/</span>
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors truncate"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                aria-current="page"
                className="font-medium text-foreground truncate"
              >
                {crumb.label}
              </span>
            )}
          </Fragment>
        ))}
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
