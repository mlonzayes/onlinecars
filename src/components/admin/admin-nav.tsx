"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Secciones del panel de plataforma. Agregar una es sumar una entrada acá + la
// page correspondiente bajo src/app/admin/.
const ADMIN_SECTIONS = [
  { href: "/admin", label: "Cuentas" },
  { href: "/admin/sitios", label: "Sitios" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b" aria-label="Secciones del panel">
      {ADMIN_SECTIONS.map((section) => {
        // "/admin" solo matchea exacto: si no, quedaría activo en todas las
        // subrutas porque todas empiezan con "/admin".
        const isActive =
          section.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(section.href);

        return (
          <Link
            key={section.href}
            href={section.href}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
