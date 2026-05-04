"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Car, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { DealershipTheme } from "@/types";
import GLOBAL_BRANDS from "@/data/brands.json";

interface BrandsSettingsProps {
  theme: DealershipTheme | null;
}

export function BrandsSettings({ theme }: BrandsSettingsProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    theme?.selectedBrandIds ?? []
  );
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBrands = GLOBAL_BRANDS.filter((brand) =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function toggleBrand(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((bId) => bId !== id) : [...prev, id]
    );
  }

  function handleSelectAll() {
    const visibleIds = filteredBrands.map(b => b.id);
    const newSelection = Array.from(new Set([...selectedIds, ...visibleIds]));
    setSelectedIds(newSelection);
  }

  function handleDeselectAll() {
    const visibleIds = filteredBrands.map(b => b.id);
    const newSelection = selectedIds.filter(id => !visibleIds.includes(id));
    setSelectedIds(newSelection);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/concesionario/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedBrandIds: selectedIds }),
      });
      if (!res.ok) throw new Error();
      toast.success("Marcas actualizadas", { duration: 2000 });
    } catch {
      toast.error("No se pudieron guardar las marcas");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5 text-indigo-500" />
          Marcas Oficiales
        </CardTitle>
        <CardDescription>
          Seleccioná las marcas que representás oficialmente. Se mostrarán con prioridad y con sus logos en el carrusel de tu sitio web público.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar marca..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Marcar visibles
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              Desmarcar visibles
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredBrands.map((brand) => {
            const isSelected = selectedIds.includes(brand.id);
            return (
              <label
                key={brand.id}
                className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border p-4 text-center transition-all hover:bg-muted/50 ${
                  isSelected ? "border-[var(--tenant-primary,blue)] bg-blue-50/10 shadow-sm" : "border-border"
                }`}
              >
                <div className="flex h-12 w-full items-center justify-center">
                  {brand.logoUrl ? (
                    <img
                      src={brand.logoUrl}
                      alt={brand.name}
                      className={`max-h-full max-w-full object-contain transition-all ${
                        isSelected ? "grayscale-0 opacity-100" : "grayscale opacity-50"
                      }`}
                    />
                  ) : (
                    <Car className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleBrand(brand.id)}
                    className="h-4 w-4"
                  />
                  <span className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                    {brand.name}
                  </span>
                </div>
              </label>
            );
          })}
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
            ) : (
              "Guardar Marcas"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
