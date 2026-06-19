"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DEALERSHIP_PLANS } from "@/lib/constants";

interface AccountRowActionsProps {
  id: string;
  name: string;
  plan: string;
  subscriptionStatus: string;
}

// bg-background/text-foreground explícitos para que el dropdown nativo sea
// legible en dark mode (sin esto el browser usa fondo blanco).
const SELECT_CLASS =
  "h-8 rounded-md border bg-background px-2 text-xs capitalize text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

export function AccountRowActions({
  id,
  name,
  plan,
  subscriptionStatus,
}: AccountRowActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  const isSuspended = subscriptionStatus === "suspended";

  async function patch(body: Record<string, unknown>, successMsg: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dealerships/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al actualizar");
        return;
      }
      toast.success(successMsg);
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  function handlePlanChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (next === plan) return;
    void patch({ plan: next }, `Plan actualizado a ${next}`);
  }

  function handleToggle() {
    if (isSuspended) {
      void patch({ subscriptionStatus: "active" }, "Cuenta habilitada");
    } else {
      setConfirmSuspend(true);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className={SELECT_CLASS}
        value={plan}
        disabled={loading}
        onChange={handlePlanChange}
        aria-label="Plan"
      >
        {DEALERSHIP_PLANS.map((p) => (
          <option key={p} value={p} className="bg-background text-foreground">
            {p}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={cn(
          "h-8 shrink-0 rounded-md border px-2.5 text-xs font-medium disabled:opacity-50",
          isSuspended
            ? "border-green-300 text-green-700 hover:bg-green-50"
            : "border-red-300 text-red-700 hover:bg-red-50"
        )}
      >
        {isSuspended ? "Habilitar" : "Suspender"}
      </button>

      <ConfirmDialog
        open={confirmSuspend}
        onOpenChange={(open) => !open && setConfirmSuspend(false)}
        title={`Suspender ${name}`}
        description="La cuenta no va a poder acceder al dashboard hasta que la habilites de nuevo."
        confirmLabel="Suspender"
        destructive
        onConfirm={async () => {
          await patch({ subscriptionStatus: "suspended" }, "Cuenta suspendida");
          setConfirmSuspend(false);
        }}
      />
    </div>
  );
}
