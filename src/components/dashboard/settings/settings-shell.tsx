"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Building2, CreditCard, DollarSign, Users, type LucideIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DEFAULT_SETTINGS_SECTION,
  SETTINGS_SECTIONS,
  resolveSettingsSection,
  type SettingsSection,
} from "@/lib/settings-sections";

const ICON_BY_SECTION: Record<SettingsSection, LucideIcon> = {
  general: Building2,
  cotizacion: DollarSign,
  usuarios: Users,
  suscripcion: CreditCard,
};

interface SettingsShellProps {
  initialSection: SettingsSection;
  /** Contenido ya renderizado en el server, uno por sección. */
  panels: Record<SettingsSection, ReactNode>;
}

// Navegación lateral de configuración. Vertical en desktop (con 4+ secciones una
// barra horizontal no escala), apilada arriba en mobile.
export function SettingsShell({ initialSection, panels }: SettingsShellProps) {
  const [active, setActive] = useState<SettingsSection>(initialSection);

  // Back/forward del browser: la URL manda, el estado se resincroniza desde ella.
  useEffect(() => {
    function syncFromUrl() {
      const tab = new URLSearchParams(window.location.search).get("tab");
      setActive(resolveSettingsSection(tab));
    }
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  // pushState nativo en lugar de router.push: cambiar de solapa NO tiene que
  // re-ejecutar las queries de la page (Prisma + Clerk + cotización). Igual queda
  // en el historial, así que el back del browser vuelve a la solapa anterior.
  function handleChange(value: SettingsSection) {
    setActive(value);

    const params = new URLSearchParams(window.location.search);
    // El default no se escribe en la URL: un solo estado canónico y URLs limpias.
    if (value === DEFAULT_SETTINGS_SECTION) {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }

    const qs = params.toString();
    window.history.pushState(null, "", qs ? `?${qs}` : window.location.pathname);
  }

  return (
    <Tabs
      orientation="vertical"
      value={active}
      onValueChange={(value) => handleChange(resolveSettingsSection(String(value)))}
      className="gap-6 max-lg:flex-col"
    >
      <TabsList className="h-fit w-full shrink-0 gap-1 p-1 max-lg:flex-row lg:w-56">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = ICON_BY_SECTION[section.value];
          return (
            <TabsTrigger
              key={section.value}
              value={section.value}
              className="h-9 gap-2 px-3 max-lg:justify-center"
            >
              <Icon className="shrink-0" />
              <span className="truncate">{section.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {SETTINGS_SECTIONS.map((section) => (
        // min-w-0 evita que el contenido ancho (mapa, tablas) desborde el flex row.
        <TabsContent key={section.value} value={section.value} className="min-w-0 space-y-6">
          {panels[section.value]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
