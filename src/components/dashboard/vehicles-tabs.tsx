"use client";

import { FileSpreadsheet, List } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleImportPanel } from "./vehicle-import-panel";

interface VehiclesTabsProps {
  dealershipCurrency: string;
  /** Listado server-rendered (search + tabla + paginación). */
  children: React.ReactNode;
}

/**
 * Solapas de la pantalla de vehículos: listado e importación.
 *
 * La solapa activa vive en estado local y NO en la URL, a diferencia de los
 * filtros del listado. Motivo: la page corre siete queries de Prisma por render,
 * y alternar entre "ver mi stock" e "importar" no tiene por qué pagarlas de
 * nuevo — los dos paneles ya están en el DOM. El listado se mantiene fresco
 * igual porque el import dispara `router.refresh()` al terminar.
 */
export function VehiclesTabs({ dealershipCurrency, children }: VehiclesTabsProps) {
  return (
    <Tabs defaultValue="listado" className="gap-4">
      <TabsList variant="line">
        <TabsTrigger value="listado">
          <List />
          Listado
        </TabsTrigger>
        <TabsTrigger value="importar">
          <FileSpreadsheet />
          Importar Excel
        </TabsTrigger>
      </TabsList>

      <TabsContent value="listado" className="space-y-6">
        {children}
      </TabsContent>

      <TabsContent value="importar">
        <VehicleImportPanel dealershipCurrency={dealershipCurrency} />
      </TabsContent>
    </Tabs>
  );
}
