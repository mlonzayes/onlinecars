"use client";

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHAT_COPY } from "@/lib/chat/copy";
import { cn } from "@/lib/utils";
import type { PendingActionView } from "@/lib/chat/pending-actions";

interface PendingActionCardProps {
  action: PendingActionView;
  onResolve: (id: string, decision: "confirm" | "cancel") => Promise<{ ok: boolean; message: string }>;
}

// Tarjeta de confirmación de una acción que el chat dejó pendiente. La acción
// recién se ejecuta acá, con el click del usuario: el modelo no puede.
export function PendingActionCard({ action, onResolve }: PendingActionCardProps) {
  const [busy, setBusy] = useState<"confirm" | "cancel" | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handle(decision: "confirm" | "cancel") {
    setBusy(decision);
    try {
      setResult(await onResolve(action.id, decision));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className={cn(
        "mt-2 border-l-2 bg-background/60 py-2 pr-2 pl-3",
        action.destructive ? "border-l-destructive" : "border-l-primary"
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{action.label}</p>
      <p className="mt-0.5 text-sm text-foreground">{action.description}</p>

      {result ? (
        <p className={cn("mt-2 text-xs", result.ok ? "text-emerald-600" : "text-destructive")}>{result.message}</p>
      ) : (
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            variant={action.destructive ? "destructive" : "default"}
            disabled={busy !== null}
            onClick={() => handle("confirm")}
          >
            {busy === "confirm" ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            {CHAT_COPY.confirm}
          </Button>
          <Button size="sm" variant="ghost" disabled={busy !== null} onClick={() => handle("cancel")}>
            {busy === "cancel" ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
            {CHAT_COPY.cancel}
          </Button>
        </div>
      )}
    </div>
  );
}
