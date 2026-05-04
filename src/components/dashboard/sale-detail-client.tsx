"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatCurrency } from "@/lib/utils";
import { SaleDocuments, type SaleDocumentData } from "./sale-documents";

// --- Types (same shape as API response serialized) ---

interface CustomerDetail {
  id: string;
  type: string;
  firstName: string;
  lastName: string | null;
  businessName: string | null;
  documentType: string;
  documentNumber: string;
  email: string | null;
  phone: string | null;
}

interface VehicleDetail {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string | null;
  vin: string | null;
}

export interface SaleDetailData {
  id: string;
  status: string;
  salePrice: string;
  currency: string;
  depositAmount: string | null;
  depositDate: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  deliveryDate: string | null;
  cancelReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: CustomerDetail;
  vehicle: VehicleDetail;
}

// --- Status config ---

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  reserved: "Reservado",
  in_progress: "En curso",
  completed: "Completado",
  cancelled: "Cancelado",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  reserved: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700",
};

const NEXT_STATUS_LABELS: Record<string, string> = {
  reserved: "Marcar como Reservado",
  in_progress: "Iniciar operación",
  completed: "Marcar como Completado",
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["reserved", "cancelled"],
  reserved: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// --- Component ---

interface SaleDetailClientProps {
  sale: SaleDetailData;
  documents: SaleDocumentData[];
}

export function SaleDetailClient({
  sale: initialSale,
  documents,
}: SaleDetailClientProps) {
  const router = useRouter();
  const [sale, setSale] = useState<SaleDetailData>(initialSale);
  const [transitioning, setTransitioning] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const allowed = VALID_TRANSITIONS[sale.status] ?? [];
  const forwardStatus = allowed.find((s) => s !== "cancelled");
  const canCancel = allowed.includes("cancelled");
  const showActions = !!forwardStatus || canCancel;

  const customerName =
    sale.customer.type === "company"
      ? sale.customer.businessName ?? sale.customer.firstName
      : [sale.customer.firstName, sale.customer.lastName].filter(Boolean).join(" ");

  async function handleTransition(status: string, extra?: Record<string, string>) {
    setTransitioning(true);
    try {
      const res = await fetch(`/api/ventas/${sale.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...extra }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al cambiar el estado");
        return;
      }
      const json = await res.json();
      setSale((prev) => ({
        ...prev,
        status: json.data.status,
        cancelReason: json.data.cancelReason ?? prev.cancelReason,
      }));
      setShowCancelForm(false);
      setCancelReason("");
      toast.success("Estado actualizado.");
      router.refresh();
    } finally {
      setTransitioning(false);
    }
  }

  async function handleCancel() {
    if (!cancelReason.trim()) {
      toast.error("Ingresá el motivo de cancelación");
      return;
    }
    await handleTransition("cancelled", { cancelReason });
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={<Link href="/dashboard/ventas" />}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detalle de venta</h1>
            <p className="text-sm text-muted-foreground font-mono">{sale.id}</p>
          </div>
        </div>
        <Badge className={cn("text-sm px-3 py-1", STATUS_STYLES[sale.status] ?? "")}>
          {STATUS_LABELS[sale.status] ?? sale.status}
        </Badge>
      </div>

      {/* Acciones de estado — globales (visibles en cualquier tab) */}
      {showActions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avanzar estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {forwardStatus && (
                <Button
                  onClick={() => handleTransition(forwardStatus)}
                  disabled={transitioning}
                >
                  {transitioning ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {NEXT_STATUS_LABELS[forwardStatus] ?? forwardStatus}
                </Button>
              )}

              {canCancel && !showCancelForm && (
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setShowCancelForm(true)}
                  disabled={transitioning}
                >
                  Cancelar venta
                </Button>
              )}
            </div>

            {showCancelForm && (
              <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <Label htmlFor="cancelReason" className="text-red-800">
                  Motivo de cancelación *
                </Label>
                <Textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ej: El cliente desistió de la compra..."
                  rows={3}
                  maxLength={500}
                  className="border-red-200 focus:ring-red-300"
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={transitioning || !cancelReason.trim()}
                  >
                    {transitioning ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Confirmar cancelación
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCancelForm(false);
                      setCancelReason("");
                    }}
                    disabled={transitioning}
                  >
                    Volver
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs de contenido */}
      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="cliente">Cliente</TabsTrigger>
          <TabsTrigger value="vehiculo">Vehículo</TabsTrigger>
          <TabsTrigger value="documentos">
            Documentos
            {documents.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] font-semibold leading-none">
                {documents.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="cierre">Cierre</TabsTrigger>
        </TabsList>

        {/* Resumen */}
        <TabsContent value="resumen" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos de la venta</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Precio de venta</dt>
                  <dd className="font-semibold">
                    {formatCurrency(sale.salePrice, sale.currency)}
                  </dd>
                </div>
                {sale.depositAmount && (
                  <div>
                    <dt className="text-muted-foreground">Seña</dt>
                    <dd className="font-semibold">
                      {formatCurrency(sale.depositAmount, sale.currency)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground">Moneda</dt>
                  <dd className="font-semibold">{sale.currency}</dd>
                </div>
                {sale.depositDate && (
                  <div>
                    <dt className="text-muted-foreground">Fecha de seña</dt>
                    <dd>{formatDate(sale.depositDate)}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground">Creada</dt>
                  <dd>{formatDate(sale.createdAt)}</dd>
                </div>
                {sale.cancelReason && (
                  <div className="col-span-2 sm:col-span-3">
                    <dt className="text-muted-foreground">Motivo de cancelación</dt>
                    <dd className="text-red-700">{sale.cancelReason}</dd>
                  </div>
                )}
                {sale.notes && (
                  <div className="col-span-2 sm:col-span-3">
                    <dt className="text-muted-foreground">Notas</dt>
                    <dd className="whitespace-pre-wrap">{sale.notes}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cliente */}
        <TabsContent value="cliente" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Nombre</dt>
                  <dd className="font-semibold">{customerName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Documento</dt>
                  <dd>
                    {sale.customer.documentType} {sale.customer.documentNumber}
                  </dd>
                </div>
                {sale.customer.email && (
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd>{sale.customer.email}</dd>
                  </div>
                )}
                {sale.customer.phone && (
                  <div>
                    <dt className="text-muted-foreground">Teléfono</dt>
                    <dd>{sale.customer.phone}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/dashboard/clientes/${sale.customer.id}`} />}
                >
                  Ver cliente
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vehículo */}
        <TabsContent value="vehiculo" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vehículo</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Título</dt>
                  <dd className="font-semibold">{sale.vehicle.title}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Año</dt>
                  <dd>{sale.vehicle.year}</dd>
                </div>
                {sale.vehicle.licensePlate && (
                  <div>
                    <dt className="text-muted-foreground">Patente</dt>
                    <dd>{sale.vehicle.licensePlate}</dd>
                  </div>
                )}
                {sale.vehicle.vin && (
                  <div>
                    <dt className="text-muted-foreground">VIN / Chasis</dt>
                    <dd className="font-mono text-xs">{sale.vehicle.vin}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/dashboard/vehiculos/${sale.vehicle.id}`} />}
                >
                  Ver vehículo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentos */}
        <TabsContent value="documentos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Legajo digital</CardTitle>
            </CardHeader>
            <CardContent>
              <SaleDocuments saleId={sale.id} initialDocuments={documents} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cierre */}
        <TabsContent value="cierre" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cierre de la operación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                <p className="font-medium">Próximamente</p>
                <p className="mt-1 text-xs">
                  Integraciones con ARCA y demás sistemas para el seguimiento automatizado de facturación y entrega de unidades.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
