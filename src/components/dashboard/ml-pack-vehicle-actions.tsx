"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink, Loader2, Star, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isMLUpgradeListingType, type MLUpgradeListingType } from "@/lib/mercadolibre/listing-types";
import { requestMLListingType, requestMLPublish } from "@/lib/mercadolibre/publish-request";
import type { MLPackVehicleRow } from "./ml-pack-vehicles-table";

const UPGRADE_OPTIONS: { value: MLUpgradeListingType; label: string }[] = [
  { value: "gold", label: "Destacar Oro" },
  { value: "gold_premium", label: "Destacar Oro Premium" },
];

interface Props {
  row: MLPackVehicleRow;
  canEdit: boolean;
  upgradesRemaining: Partial<Record<MLUpgradeListingType, number>>;
}

/** Acción principal de cada fila según el estado del vehículo en ML. */
export function MLPackVehicleActions({ row, canEdit, upgradesRemaining }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const listing = row.listing;
  const publishable = !listing || listing.status === "closed";

  async function run(action: () => ReturnType<typeof requestMLPublish>) {
    setLoading(true);
    try {
      const result = await action();
      if (!result.ok) toast.error(result.message);
      else if (result.paymentRequired) toast.warning(result.message);
      else toast.success(result.message);
      if (result.ok) router.refresh();
    } catch {
      toast.error("No pudimos conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  if (publishable) {
    if (!canEdit) return null;
    return (
      <Button size="sm" disabled={loading} onClick={() => run(() => requestMLPublish(row.id))}>
        {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
        Publicar
      </Button>
    );
  }

  const isUpgraded = isMLUpgradeListingType(listing.listingTypeId);

  return (
    <div className="flex items-center justify-end gap-2">
      {listing.permalink && (
        <a
          href={listing.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          {listing.status === "payment_required" ? "Pagar en ML" : "Ver en ML"}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
      {listing.status === "error" && (
        <Link href={`/dashboard/vehiculos/${row.id}`} className="text-sm underline-offset-4 hover:underline">
          Ver error
        </Link>
      )}
      {listing.status === "active" && canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium hover:bg-accent disabled:opacity-50"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="h-3.5 w-3.5" />}
            Destacar
            <ChevronDown className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            {UPGRADE_OPTIONS.map((opt) => {
              const left = upgradesRemaining[opt.value] ?? 0;
              const current = listing.listingTypeId === opt.value;
              return (
                <DropdownMenuItem
                  key={opt.value}
                  disabled={current || left === 0}
                  onClick={() => run(() => requestMLListingType(row.id, opt.value))}
                >
                  {opt.label}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {current ? "actual" : `${left} libres`}
                  </span>
                </DropdownMenuItem>
              );
            })}
            {isUpgraded && (
              <DropdownMenuItem onClick={() => run(() => requestMLListingType(row.id, "silver"))}>
                Quitar destaque
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
