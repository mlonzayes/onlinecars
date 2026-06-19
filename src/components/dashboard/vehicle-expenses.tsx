"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Receipt, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn, formatCurrency } from "@/lib/utils";
import { computeVehicleMargin, convertAmount } from "@/lib/margin";
import {
  CURRENCIES,
  VEHICLE_EXPENSE_CATEGORIES,
  VEHICLE_EXPENSE_CATEGORY_LABELS,
} from "@/lib/constants";

export interface SerializedExpense {
  id: string;
  category: string;
  description: string | null;
  amount: string;
  currency: string;
  date: string;
}

interface VehicleExpensesProps {
  vehicleId: string;
  expenses: SerializedExpense[];
  canEdit: boolean;
  // Datos para el resumen de margen neto (precio − costo − gastos).
  price: number;
  currency: string;
  costPrice: number | null;
  costCurrency: string | null;
  usdRate: number | null;
}

// bg-background/text-foreground explícitos: sin esto, el dropdown nativo del
// browser usa fondo blanco y el texto queda ilegible en dark mode.
const SELECT_CLASS =
  "h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";
const OPTION_CLASS = "bg-background text-foreground";

export function VehicleExpenses({
  vehicleId,
  expenses,
  canEdit,
  price,
  currency,
  costPrice,
  costCurrency,
  usdRate,
}: VehicleExpensesProps) {
  const router = useRouter();
  const [category, setCategory] = useState<string>(VEHICLE_EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [expCurrency, setExpCurrency] = useState<string>(currency);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const amounts = expenses.map((e) => ({ amount: Number(e.amount), currency: e.currency }));
  const margin = computeVehicleMargin({
    price,
    currency,
    costPrice,
    costCurrency,
    usdToArsRate: usdRate,
    expenses: amounts,
  });
  // Total de gastos normalizado a la moneda de venta (null si falta cotización).
  const expensesTotal = amounts.reduce<number | null>((acc, e) => {
    if (acc === null) return null;
    const v = convertAmount(e.amount, e.currency, currency, usdRate);
    return v === null ? null : acc + v;
  }, 0);

  async function handleAdd() {
    const amountNum = Number.parseFloat(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast.error("Ingresá un monto válido");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/vehiculos/${vehicleId}/gastos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          amount: amountNum,
          currency: expCurrency,
          description: description.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al agregar el gasto");
        return;
      }
      toast.success("Gasto agregado");
      setAmount("");
      setDescription("");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    try {
      const res = await fetch(`/api/vehiculos/${vehicleId}/gastos/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Error al eliminar el gasto");
        return;
      }
      toast.success("Gasto eliminado");
      router.refresh();
    } finally {
      setConfirmDeleteId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          Gastos del vehículo
        </CardTitle>
        <CardDescription>
          Reacondicionamiento, transferencia, gestoría, etc. Se descuentan del margen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canEdit && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.2fr_1fr_auto_1.2fr_auto] sm:items-end">
            <div className="flex flex-col gap-1">
              <Label htmlFor="exp-cat" className="text-xs">Categoría</Label>
              <select id="exp-cat" className={SELECT_CLASS} value={category} onChange={(e) => setCategory(e.target.value)}>
                {VEHICLE_EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c} className={OPTION_CLASS}>
                    {VEHICLE_EXPENSE_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="exp-amount" className="text-xs">Monto</Label>
              <Input id="exp-amount" type="number" min={0} step={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="exp-cur" className="text-xs">Moneda</Label>
              <select id="exp-cur" className={cn(SELECT_CLASS, "w-20")} value={expCurrency} onChange={(e) => setExpCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c} className={OPTION_CLASS}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="exp-desc" className="text-xs">Descripción</Label>
              <Input id="exp-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" />
            </div>
            <Button onClick={handleAdd} disabled={loading}>{loading ? "..." : "Agregar"}</Button>
          </div>
        )}

        {expenses.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Todavía no cargaste gastos.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {expenses.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <span className="font-medium">{VEHICLE_EXPENSE_CATEGORY_LABELS[e.category as keyof typeof VEHICLE_EXPENSE_CATEGORY_LABELS] ?? e.category}</span>
                  {e.description && <span className="text-muted-foreground"> · {e.description}</span>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-medium tabular-nums">{formatCurrency(Number(e.amount), e.currency)}</span>
                  {canEdit && (
                    <button type="button" onClick={() => setConfirmDeleteId(e.id)} className="text-muted-foreground hover:text-red-600" aria-label="Eliminar gasto">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Resumen: total de gastos + margen neto */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            Total en gastos:{" "}
            <span className="font-medium text-foreground tabular-nums">
              {expensesTotal !== null ? formatCurrency(expensesTotal, currency) : "—"}
            </span>
          </span>
          {margin && (
            <span className="text-muted-foreground">
              Margen neto:{" "}
              <span className={cn("font-semibold tabular-nums", margin.amount >= 0 ? "text-emerald-600" : "text-red-600")}>
                {margin.amount >= 0 ? "+" : ""}{formatCurrency(margin.amount, margin.currency)} ({Math.round(margin.pct)}%)
              </span>
            </span>
          )}
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Eliminar gasto"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleDeleteConfirmed}
      />
    </Card>
  );
}
