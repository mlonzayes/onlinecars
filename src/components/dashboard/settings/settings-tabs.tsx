"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Settings, Globe } from "lucide-react";

const TABS = [
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
  { href: "/dashboard/sitio-web", label: "Sitio Web", icon: Globe },
] as const;

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 rounded-xl border bg-muted/50 p-1">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
