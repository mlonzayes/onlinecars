"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Car, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { MLUpgradeListingType } from "@/lib/mercadolibre/listing-types";
import { requestMLPublish } from "@/lib/mercadolibre/publish-request";
import { MLPackVehicleActions } from "./ml-pack-vehicle-actions";
import { MLListingStateBadge } from "./ml-listing-state-badge";

export interface MLPackVehicleRow {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string | null;
  price: string;
  currency: string;
  imageUrl: string | null;
  listing: { status: string; listingTypeId: string; permalink: string | null } | null;
}

interface Props {
  rows: MLPackVehicleRow[];
  filtersActive: boolean;
  // null = no sabemos el cupo (ML no respondió)
  publicationsRemaining: number | null;
  upgradesRemaining: Partial<Record<MLUpgradeListingType, number>>;
  canEdit: boolean;
  allowBulk: boolean;
}

const isPublishable = (row: MLPackVehicleRow) => !row.listing || row.listing.status === "closed";

/** Stock disponible cruzado con su estado en ML, con publicación masiva contra el cupo. */
export function MLPackVehiclesTable(props: Props) {
  const { rows, filtersActive, publicationsRemaining, upgradesRemaining, canEdit, allowBulk } = props;
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const publishableIds = rows.filter(isPublishable).map((r) => r.id);
  const selectable = canEdit && allowBulk && publishableIds.length > 0;
  const allSelected = publishableIds.length > 0 && publishableIds.every((id) => selectedIds.has(id));

  function toggle(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleBulkPublishConfirmed() {
    const ids = [...selectedIds];
    setBulkLoading(true);
    try {
      const results = await Promise.allSettled(ids.map((id) => requestMLPublish(id)));
      const ok = results.filter((r) => r.status === "fulfilled" && r.value.ok);
      const pending = ok.filter((r) => r.status === "fulfilled" && r.value.paymentRequired).length;
      const failed = ids.length - ok.length;
      if (ok.length > 0) toast.success(`${ok.length} publicados en Mercado Libre`);
      if (pending > 0) toast.warning(`${pending} quedaron pendientes de pago por falta de lugar`);
      if (failed > 0) toast.error(`${failed} no se pudieron publicar. Revisá los datos de cada vehículo.`);
      setSelectedIds(new Set());
      router.refresh();
    } finally {
      setBulkLoading(false);
      setConfirmBulkOpen(false);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <p className="font-medium text-muted-foreground">
          {filtersActive ? "Sin resultados" : "No tenés vehículos disponibles para publicar"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtersActive ? "Probá cambiando la búsqueda o los filtros." : "Cargá stock desde Vehículos."}
        </p>
      </div>
    );
  }

  const count = selectedIds.size;
  const overQuota = publicationsRemaining !== null && count > publicationsRemaining;
  const quotaText =
    publicationsRemaining === null
      ? "No pudimos verificar cuántos lugares te quedan."
      : `Te quedan ${publicationsRemaining} lugares en tus paquetes.`;

  return (
    <div className="space-y-4">
      {count > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">{count} seleccionados</span>
          <Button size="sm" disabled={bulkLoading} onClick={() => setConfirmBulkOpen(true)}>
            {bulkLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
            Publicar en ML
          </Button>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-10">
                  <Checkbox
                    aria-label="Seleccionar todos los publicables"
                    checked={allSelected}
                    indeterminate={count > 0 && !allSelected}
                    onCheckedChange={(checked) => setSelectedIds(checked ? new Set(publishableIds) : new Set())}
                  />
                </TableHead>
              )}
              <TableHead>Vehículo</TableHead>
              <TableHead className="hidden sm:table-cell">Precio</TableHead>
              <TableHead>Mercado Libre</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {selectable && (
                  <TableCell>
                    {isPublishable(row) && (
                      <Checkbox
                        aria-label={`Seleccionar ${row.title}`}
                        checked={selectedIds.has(row.id)}
                        onCheckedChange={(checked) => toggle(row.id, checked === true)}
                      />
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
                      {row.imageUrl ? (
                        <Image src={row.imageUrl} alt={row.title} fill sizes="56px" className="object-cover" />
                      ) : (
                        <Car className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{row.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.brand} {row.model} · {row.year}
                        {row.licensePlate && (
                          <>
                            {" · "}
                            <span className="font-mono uppercase tracking-wider text-foreground/80">
                              {row.licensePlate}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{formatCurrency(row.price, row.currency)}</TableCell>
                <TableCell>
                  <MLListingStateBadge listing={row.listing} />
                </TableCell>
                <TableCell className="text-right">
                  <MLPackVehicleActions row={row} canEdit={canEdit} upgradesRemaining={upgradesRemaining} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={confirmBulkOpen}
        onOpenChange={setConfirmBulkOpen}
        title={`Publicar ${count} ${count === 1 ? "vehículo" : "vehículos"} en Mercado Libre`}
        description={
          overQuota
            ? `${quotaText} Los que no entren en el cupo se crean igual en Mercado Libre, pero quedan pendientes de pago.`
            : `Cada publicación usa un lugar de tus paquetes. ${quotaText}`
        }
        confirmLabel="Publicar"
        onConfirm={handleBulkPublishConfirmed}
      />
    </div>
  );
}
