"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuotationStatusBadge } from "./quotation-status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatCurrency } from "@/lib/utils";
import {
  FUEL_TYPE_LABELS,
  TRANSMISSION_TYPE_LABELS,
  VEHICLE_CONDITION_LABELS,
  type FuelType,
  type QuotationPaymentMethod,
  type QuotationStatus,
  type QuotationType,
  type TransmissionType,
  type VehicleCondition,
} from "@/lib/constants";

const PAYMENT_METHOD_LABELS: Record<QuotationPaymentMethod, string> = {
  cash: "Contado",
  financed: "Financiado",
  mixed: "Mixto",
};

export interface QuotationDetail {
  id: string;
  type: QuotationType;
  code: string;
  status: string;
  effectiveStatus: QuotationStatus;
  currency: string;
  validUntil: string;
  emittedAt: string;
  notes: string | null;
  // Sale
  saleClientName: string | null;
  saleClientDocument: string | null;
  saleClientEmail: string | null;
  saleClientPhone: string | null;
  saleTotalPrice: string | null;
  saleDownPayment: string | null;
  saleInstallments: number | null;
  saleInstallmentAmount: string | null;
  salePaymentMethod: string | null;
  saleSellerName: string | null;
  saleTradeInBrand: string | null;
  saleTradeInModel: string | null;
  saleTradeInYear: number | null;
  saleTradeInValue: string | null;
  saleTradeInCurrency: string | null;
  // Purchase
  purchaseSellerName: string | null;
  purchaseSellerDocument: string | null;
  purchaseSellerEmail: string | null;
  purchaseSellerPhone: string | null;
  purchaseBrand: string | null;
  purchaseModel: string | null;
  purchaseYear: number | null;
  purchaseVersion: string | null;
  purchaseKilometers: number | null;
  purchaseColor: string | null;
  purchaseFuelType: string | null;
  purchaseTransmission: string | null;
  purchaseCondition: string | null;
  purchaseOfferAmount: string | null;
  purchasePaymentMethod: string | null;
  // Relations
  vehicle: {
    id: string;
    title: string;
    brand: string;
    model: string;
    year: number;
    kilometers: number | null;
    color: string | null;
    transmission: string | null;
    fuelType: string | null;
    condition: string;
  } | null;
  lead: { id: string; name: string; email: string | null; phone: string | null } | null;
}

const TOAST_DURATION = 2000;

function FieldRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5 py-1.5">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm">{String(value)}</span>
    </div>
  );
}

function formatDateOnly(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function QuotationDetailClient({
  quotation,
}: {
  quotation: QuotationDetail;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<
    "accept" | "reject" | "delete" | "extend" | null
  >(null);
  const [extendOpen, setExtendOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [newValidUntil, setNewValidUntil] = useState(
    new Date(quotation.validUntil).toISOString().slice(0, 10)
  );

  const isPending = quotation.status === "pending";
  // Mismo criterio que el endpoint DELETE: pending y rejected son borrables.
  // accepted/expired NO se borran (queda histórico de operaciones cerradas).
  const isDeletable = quotation.status === "pending" || quotation.status === "rejected";
  const isExpired = quotation.effectiveStatus === "expired";
  const canChangeStatus = isPending && !isExpired;

  async function handleStatusChange(target: "accepted" | "rejected") {
    setPendingAction(target === "accepted" ? "accept" : "reject");
    try {
      const res = await fetch(
        `/api/cotizaciones/${quotation.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: target }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al cambiar el estado", {
          duration: TOAST_DURATION,
        });
        return;
      }
      toast.success(
        target === "accepted" ? "Cotización aceptada" : "Cotización rechazada",
        { duration: TOAST_DURATION }
      );
      router.refresh();
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete() {
    setPendingAction("delete");
    try {
      const res = await fetch(`/api/cotizaciones/${quotation.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al eliminar", {
          duration: TOAST_DURATION,
        });
        setPendingAction(null);
        return;
      }
      toast.success("Cotización eliminada", { duration: TOAST_DURATION });
      router.push("/dashboard/cotizaciones");
      router.refresh();
    } catch {
      setPendingAction(null);
    }
  }

  async function handleExtend() {
    const target = new Date(newValidUntil + "T23:59:59");
    if (isNaN(target.getTime()) || target < new Date()) {
      toast.error("Ingresá una fecha futura válida");
      return;
    }
    setPendingAction("extend");
    try {
      const res = await fetch(`/api/cotizaciones/${quotation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validUntil: target.toISOString() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al extender la validez", {
          duration: TOAST_DURATION,
        });
        return;
      }
      toast.success("Validez extendida", { duration: TOAST_DURATION });
      setExtendOpen(false);
      router.refresh();
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <Link
            href="/dashboard/cotizaciones"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver al listado
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono">{quotation.code}</h1>
            <QuotationStatusBadge status={quotation.effectiveStatus} />
          </div>
          <p className="text-sm text-muted-foreground">
            {quotation.type === "sale"
              ? "Cotización de venta"
              : "Cotización de compra"}{" "}
            · Emitida {formatDateOnly(quotation.emittedAt)} · Válida hasta{" "}
            {formatDateOnly(quotation.validUntil)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <a
                href={`/api/cotizaciones/${quotation.id}/pdf`}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver PDF
          </Button>
          <Button
            nativeButton={false}
            render={
              <a href={`/api/cotizaciones/${quotation.id}/pdf?download=1`} />
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </div>

      {/* Alerta si está vencida */}
      {isExpired && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          <div className="flex items-start gap-3">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Esta cotización está vencida</p>
              <p className="mt-1 text-orange-700">
                Extendé la fecha de validez para poder marcarla como aceptada
                o rechazada.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExtendOpen((v) => !v)}
            >
              {extendOpen ? "Cancelar" : "Extender validez"}
            </Button>
          </div>
          {extendOpen && (
            <div className="mt-3 flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="newValidUntil" className="text-xs">
                  Nueva fecha de validez
                </Label>
                <Input
                  id="newValidUntil"
                  type="date"
                  value={newValidUntil}
                  onChange={(e) => setNewValidUntil(e.target.value)}
                  className="bg-white"
                />
              </div>
              <Button
                size="sm"
                onClick={handleExtend}
                disabled={pendingAction === "extend"}
              >
                {pendingAction === "extend" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Aplicar"
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {quotation.type === "sale" ? (
            <SaleBlocks quotation={quotation} />
          ) : (
            <PurchaseBlocks quotation={quotation} />
          )}

          {quotation.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Observaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{quotation.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna lateral: acciones */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canChangeStatus && (
                <>
                  <Button
                    className="w-full justify-start"
                    onClick={() => handleStatusChange("accepted")}
                    disabled={pendingAction !== null}
                  >
                    {pendingAction === "accept" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Marcar como aceptada
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleStatusChange("rejected")}
                    disabled={pendingAction !== null}
                  >
                    {pendingAction === "reject" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    Marcar como rechazada
                  </Button>
                </>
              )}

              {!isPending && (
                <p className="text-xs text-muted-foreground">
                  Esta cotización ya no puede cambiar de estado.
                </p>
              )}

              {isPending && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  nativeButton={false}
                  render={
                    <Link
                      href={`/dashboard/cotizaciones/${quotation.id}/editar`}
                    />
                  }
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar cotización
                </Button>
              )}

              {isDeletable && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-600"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={pendingAction !== null}
                >
                  {pendingAction === "delete" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Eliminar cotización
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                PDF
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                El PDF se genera al momento de descargar y refleja el estado
                actual de la cotización.
              </p>
              {quotation.lead && (
                <p>
                  Generada desde el lead{" "}
                  <Link
                    href={`/dashboard/leads`}
                    className="underline hover:text-foreground"
                  >
                    {quotation.lead.name}
                  </Link>
                  .
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Eliminar cotización"
        description="Solo se pueden eliminar las cotizaciones pendientes. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

function SaleBlocks({ quotation }: { quotation: QuotationDetail }) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <FieldRow label="Nombre" value={quotation.saleClientName} />
          <FieldRow label="Documento" value={quotation.saleClientDocument} />
          <FieldRow label="Email" value={quotation.saleClientEmail} />
          <FieldRow label="Teléfono" value={quotation.saleClientPhone} />
        </CardContent>
      </Card>

      {quotation.vehicle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vehículo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <FieldRow label="Detalle" value={quotation.vehicle.title} />
            <FieldRow label="Marca" value={quotation.vehicle.brand} />
            <FieldRow label="Modelo" value={quotation.vehicle.model} />
            <FieldRow label="Año" value={quotation.vehicle.year} />
            <FieldRow
              label="Kilometraje"
              value={
                quotation.vehicle.kilometers !== null
                  ? `${quotation.vehicle.kilometers.toLocaleString("es-AR")} km`
                  : null
              }
            />
            <FieldRow label="Color" value={quotation.vehicle.color} />
            <FieldRow
              label="Transmisión"
              value={
                quotation.vehicle.transmission
                  ? TRANSMISSION_TYPE_LABELS[
                      quotation.vehicle.transmission as TransmissionType
                    ]
                  : null
              }
            />
            <FieldRow
              label="Combustible"
              value={
                quotation.vehicle.fuelType
                  ? FUEL_TYPE_LABELS[quotation.vehicle.fuelType as FuelType]
                  : null
              }
            />
            <FieldRow
              label="Condición"
              value={
                VEHICLE_CONDITION_LABELS[
                  quotation.vehicle.condition as VehicleCondition
                ]
              }
            />
          </CardContent>
        </Card>
      )}

      {quotation.saleTradeInBrand &&
        quotation.saleTradeInModel &&
        quotation.saleTradeInValue &&
        quotation.saleTradeInCurrency && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Vehículo entregado en parte de pago
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              <FieldRow label="Marca" value={quotation.saleTradeInBrand} />
              <FieldRow label="Modelo" value={quotation.saleTradeInModel} />
              <FieldRow label="Año" value={quotation.saleTradeInYear} />
              <FieldRow
                label="Valor tomado"
                value={`${formatCurrency(
                  quotation.saleTradeInValue,
                  quotation.saleTradeInCurrency
                )} ${quotation.saleTradeInCurrency}`}
              />
            </CardContent>
          </Card>
        )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Condiciones comerciales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <FieldRow
              label="Forma de pago"
              value={
                quotation.salePaymentMethod
                  ? PAYMENT_METHOD_LABELS[
                      quotation.salePaymentMethod as QuotationPaymentMethod
                    ]
                  : null
              }
            />
            <FieldRow label="Vendedor" value={quotation.saleSellerName} />
          </div>
          <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
            {quotation.saleTradeInValue &&
              quotation.saleTradeInCurrency &&
              quotation.saleTradeInBrand &&
              quotation.saleTradeInModel && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Entrega {quotation.saleTradeInBrand}{" "}
                    {quotation.saleTradeInModel} {quotation.saleTradeInYear}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(
                      quotation.saleTradeInValue,
                      quotation.saleTradeInCurrency
                    )}{" "}
                    {quotation.saleTradeInCurrency}
                  </span>
                </div>
              )}
            {quotation.saleDownPayment && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Anticipo</span>
                <span className="font-medium">
                  {formatCurrency(quotation.saleDownPayment, quotation.currency)}
                </span>
              </div>
            )}
            {quotation.saleInstallments &&
              quotation.saleInstallmentAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {quotation.saleInstallments} cuotas de
                  </span>
                  <span className="font-medium">
                    {formatCurrency(
                      quotation.saleInstallmentAmount,
                      quotation.currency
                    )}
                  </span>
                </div>
              )}
            <div className="flex justify-between items-center border-t pt-2">
              <span className="font-medium">Total</span>
              <span className="text-xl font-bold">
                {quotation.saleTotalPrice
                  ? formatCurrency(
                      quotation.saleTotalPrice,
                      quotation.currency
                    )
                  : "—"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function PurchaseBlocks({ quotation }: { quotation: QuotationDetail }) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Vendedor</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <FieldRow label="Nombre" value={quotation.purchaseSellerName} />
          <FieldRow
            label="Documento"
            value={quotation.purchaseSellerDocument}
          />
          <FieldRow label="Email" value={quotation.purchaseSellerEmail} />
          <FieldRow label="Teléfono" value={quotation.purchaseSellerPhone} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Vehículo a comprar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <FieldRow label="Marca" value={quotation.purchaseBrand} />
          <FieldRow label="Modelo" value={quotation.purchaseModel} />
          <FieldRow label="Año" value={quotation.purchaseYear} />
          <FieldRow label="Versión" value={quotation.purchaseVersion} />
          <FieldRow
            label="Kilometraje"
            value={
              quotation.purchaseKilometers !== null
                ? `${quotation.purchaseKilometers.toLocaleString("es-AR")} km`
                : null
            }
          />
          <FieldRow label="Color" value={quotation.purchaseColor} />
          <FieldRow
            label="Transmisión"
            value={
              quotation.purchaseTransmission
                ? TRANSMISSION_TYPE_LABELS[
                    quotation.purchaseTransmission as TransmissionType
                  ]
                : null
            }
          />
          <FieldRow
            label="Combustible"
            value={
              quotation.purchaseFuelType
                ? FUEL_TYPE_LABELS[quotation.purchaseFuelType as FuelType]
                : null
            }
          />
          <FieldRow
            label="Condición"
            value={
              quotation.purchaseCondition
                ? VEHICLE_CONDITION_LABELS[
                    quotation.purchaseCondition as VehicleCondition
                  ]
                : null
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Oferta de compra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <FieldRow
              label="Forma de pago"
              value={
                quotation.purchasePaymentMethod
                  ? PAYMENT_METHOD_LABELS[
                      quotation.purchasePaymentMethod as QuotationPaymentMethod
                    ]
                  : null
              }
            />
          </div>
          <div className="rounded-lg border bg-muted/40 p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Oferta</span>
              <span className="text-xl font-bold">
                {quotation.purchaseOfferAmount
                  ? formatCurrency(
                      quotation.purchaseOfferAmount,
                      quotation.currency
                    )
                  : "—"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
