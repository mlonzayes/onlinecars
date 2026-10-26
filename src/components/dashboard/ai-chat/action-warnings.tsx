"use client";

import { useId } from "react";
import { TriangleAlert } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { CHAT_COPY } from "@/lib/chat/copy";

interface ActionWarningsProps {
  warnings: string[];
  acknowledged: boolean;
  onAcknowledgedChange: (value: boolean) => void;
  disabled: boolean;
}

// Avisos de cambio sensible dentro de la tarjeta de confirmación. El check es
// el segundo paso: sin él, "Confirmar" queda deshabilitado.
export function ActionWarnings({ warnings, acknowledged, onAcknowledgedChange, disabled }: ActionWarningsProps) {
  const checkboxId = useId();

  return (
    <div role="alert" className="mt-2 border border-destructive/40 bg-destructive/10 px-2.5 py-2 text-destructive">
      <p className="flex items-center gap-1.5 text-xs font-semibold">
        <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
        {CHAT_COPY.warnings.title}
      </p>
      <ul className="mt-1 space-y-0.5 text-xs leading-snug">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
      <label htmlFor={checkboxId} className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-foreground">
        <Checkbox
          id={checkboxId}
          checked={acknowledged}
          onCheckedChange={(checked) => onAcknowledgedChange(checked === true)}
          disabled={disabled}
        />
        {CHAT_COPY.warnings.acknowledge}
      </label>
    </div>
  );
}
