"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DollarSign, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

interface ExchangeRateCardProps {
  // Spread actual del dealer (en pesos).
  usdSpread: number;
  // Cotización oficial vigente del BCRA y su fecha. null si no se pudo obtener.
  officialRate: number | null;
  rateDate: string | null;
  // Solo admins pueden editar el spread (config sensible de precios).
  isAdmin: boolean;
}

// Formatea "2026-06-18" a "18/06/2026" para mostrar la fecha del dato.
function formatRateDate(iso: string | null): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return null;
  return `${d}/${m}/${y}`;
}

export function ExchangeRateCard({
  usdSpread,
  officialRate,
  rateDate,
  isAdmin,
}: ExchangeRateCardProps) {
  const [spread, setSpread] = useState(String(usdSpread ?? 0));
  const [loading, setLoading] = useState(false);

  const spreadNum = Number.parseFloat(spread) || 0;
  const effective = officialRate !== null ? officialRate + spreadNum : null;
  const dateLabel = formatRateDate(rateDate);

  async function handleSave() {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await fetch("/api/concesionario", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usdSpread: spreadNum }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al guardar");
        return;
      }
      toast.success("Cotización actualizada");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-600" />
          Cotización del dólar
        </CardTitle>
        <CardDescription>
          Tomamos la cotización oficial del BCRA todos los días. Sumale el plus en
          pesos que quieras para fijar tu cotización de venta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Resumen: oficial → tu cotización */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Oficial (BCRA)</p>
            <p className="mt-1 font-semibold tabular-nums">
              {officialRate !== null ? formatCurrency(officialRate, "ARS") : "—"}
            </p>
            {dateLabel && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">{dateLabel}</p>
            )}
          </div>
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            + {formatCurrency(spreadNum, "ARS")}
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs text-emerald-700">Tu cotización</p>
            <p className="mt-1 font-semibold tabular-nums text-emerald-800">
              {effective !== null ? formatCurrency(effective, "ARS") : "—"}
            </p>
          </div>
        </div>

        {/* Input del spread */}
        <div className="space-y-2">
          <Label htmlFor="usd-spread">Plus en pesos sobre la oficial</Label>
          <Input
            id="usd-spread"
            type="number"
            min={0}
            step={1}
            value={spread}
            disabled={!isAdmin}
            onChange={(e) => setSpread(e.target.value)}
            className="max-w-[200px]"
          />
          <p className="text-xs text-muted-foreground">
            Dejalo en 0 para usar la cotización oficial sin recargo.
          </p>
        </div>

        {!isAdmin && (
          <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Solo un administrador puede cambiar la cotización.</p>
          </div>
        )}

        {isAdmin && (
          <div className="flex justify-end pt-1">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
