"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleCard } from "./vehicle-card";

interface FeaturedVehicle {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: string;
  currency: string;
  kilometers: number | null;
  fuelType: string | null;
  transmission: string | null;
  bodyType: string | null;
  condition: string;
  featured?: boolean;
  images: { url: string; isPrimary?: boolean; alt?: string | null; id?: string }[];
}

interface FeaturedTabsProps {
  vehicles: FeaturedVehicle[];
  basePath: string;
  // Cantidad máxima de vehículos a mostrar por tab.
  limit?: number;
}

type TabKey = "all" | "new" | "used";

const TAB_LABELS: Record<TabKey, string> = {
  all: "En stock",
  new: "0 km",
  used: "Usados",
};

export function FeaturedTabs({ vehicles, basePath, limit = 6 }: FeaturedTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  // Pre-filtrar y limitar por tab. useMemo para evitar recalcular en cada render.
  const filteredByTab = useMemo(() => {
    const all = vehicles.slice(0, limit);
    const newVehicles = vehicles.filter((v) => v.condition === "new").slice(0, limit);
    const usedVehicles = vehicles.filter((v) => v.condition === "used").slice(0, limit);
    return { all, new: newVehicles, used: usedVehicles };
  }, [vehicles, limit]);

  const linkHref =
    activeTab === "all"
      ? `${basePath}/catalogo`
      : `${basePath}/catalogo?condition=${activeTab}`;

  return (
    <div>
      <Tabs
        value={activeTab}
        onValueChange={(v) => v !== null && setActiveTab(v as TabKey)}
      >
        <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:mb-8 sm:flex-row">
          <TabsList>
            <TabsTrigger value="all">{TAB_LABELS.all}</TabsTrigger>
            <TabsTrigger value="new">{TAB_LABELS.new}</TabsTrigger>
            <TabsTrigger value="used">{TAB_LABELS.used}</TabsTrigger>
          </TabsList>

          <Link
            href={linkHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--tenant-primary)] hover:underline"
          >
            Ver todo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {(["all", "new", "used"] as TabKey[]).map((key) => (
          <TabsContent key={key} value={key}>
            {filteredByTab[key].length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-500">
                Sin vehículos en esta categoría todavía.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredByTab[key].map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    basePath={basePath}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
