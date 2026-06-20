"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CURRENCIES } from "@/lib/constants";

interface RegisterPaymentDialogProps {
  dealershipId: string;
  dealershipName: string;
}

export function RegisterPaymentDialog({
  dealershipId,
  dealershipName,
}: RegisterPaymentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("ARS");
  const [method, setMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const amountNum = Number.parseFloat(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast.error("Ingresá un monto válido");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dealerships/${dealershipId}/pagos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          currency,
          method: method.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al registrar el pago");
        return;
      }
      toast.success("Pago registrado");
      setOpen(false);
      setAmount("");
      setMethod("");
      setNotes("");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="h-8 shrink-0 rounded-md border border-blue-300 px-2.5 text-xs font-medium text-blue-700 hover:bg-blue-50">
        Registrar pago
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago · {dealershipName}</DialogTitle>
          <DialogDescription>
            Extiende la suscripción +1 mes. Si la cuenta está en trial, pasa a activa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div className="space-y-1">
              <Label htmlFor="pay-amount">Monto</Label>
              <Input
                id="pay-amount"
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pay-cur">Moneda</Label>
              <select
                id="pay-cur"
                className="h-9 w-20 rounded-md border bg-background px-2 text-sm text-foreground outline-none"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c} className="bg-background text-foreground">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="pay-method">Método</Label>
            <Input
              id="pay-method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              placeholder="Efectivo, transferencia, MP..."
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pay-notes">Notas</Label>
            <Input
              id="pay-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Guardando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
