import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_QUOTATION_VALIDITY_DAYS,
  type FuelType,
  type QuotationPaymentMethod,
  type TransmissionType,
  type VehicleCondition,
} from "@/lib/constants";
import { QuotationSaleForm } from "@/components/dashboard/quotation-sale-form";
import { QuotationPurchaseForm } from "@/components/dashboard/quotation-purchase-form";

interface EditarCotizacionPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Calcula los días restantes entre validUntil y emittedAt. Lo usamos como
 * default del campo validityDays del form en modo edit, así el dealer ve un
 * número significativo en lugar del default de N días.
 */
function diffDays(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export default async function EditarCotizacionPage({
  params,
}: EditarCotizacionPageProps) {
  const { id } = await params;

  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/onboarding");

  const quotation = await prisma.quotation.findFirst({
    where: { id, dealershipId: dealership.id },
    include: {
      vehicle: {
        select: {
          id: true,
          title: true,
          brand: true,
          model: true,
          year: true,
          price: true,
          currency: true,
        },
      },
    },
  });

  if (!quotation) notFound();

  // Solo pending es editable. Si no, redirigimos al detail — el detail muestra
  // el banner correspondiente. Evita que el dealer pierda tiempo cargando un
  // form para descubrir el bloqueo al hacer submit.
  if (quotation.status !== "pending") {
    redirect(`/dashboard/cotizaciones/${id}`);
  }

  const validityDays = diffDays(quotation.emittedAt, quotation.validUntil);

  if (quotation.type === "sale") {
    const initialVehicle = quotation.vehicle
      ? {
          id: quotation.vehicle.id,
          title: quotation.vehicle.title,
          brand: quotation.vehicle.brand,
          model: quotation.vehicle.model,
          year: quotation.vehicle.year,
          price: quotation.vehicle.price.toString(),
          currency: quotation.vehicle.currency,
        }
      : undefined;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href={`/dashboard/cotizaciones/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al detalle
        </Link>
        <h1 className="text-2xl font-bold">Editar cotización {quotation.code}</h1>
        <QuotationSaleForm
          quotationId={quotation.id}
          initialVehicle={initialVehicle}
          initialValues={{
            vehicleId: quotation.vehicleId ?? "",
            clientName: quotation.saleClientName ?? "",
            clientDocument: quotation.saleClientDocument ?? "",
            clientEmail: quotation.saleClientEmail ?? "",
            clientPhone: quotation.saleClientPhone ?? "",
            totalPrice: quotation.saleTotalPrice?.toString() ?? "",
            downPayment: quotation.saleDownPayment?.toString() ?? "",
            installments: quotation.saleInstallments?.toString() ?? "",
            installmentAmount: quotation.saleInstallmentAmount?.toString() ?? "",
            paymentMethod:
              (quotation.salePaymentMethod as QuotationPaymentMethod | null) ?? "cash",
            sellerName: quotation.saleSellerName ?? "",
            currency: quotation.currency,
            validityDays: String(validityDays || DEFAULT_QUOTATION_VALIDITY_DAYS),
            notes: quotation.notes ?? "",
            tradeInEnabled: !!quotation.saleTradeInBrand,
            tradeInBrand: quotation.saleTradeInBrand ?? "",
            tradeInModel: quotation.saleTradeInModel ?? "",
            tradeInYear: quotation.saleTradeInYear?.toString() ?? "",
            tradeInValue: quotation.saleTradeInValue?.toString() ?? "",
            tradeInCurrency: quotation.saleTradeInCurrency ?? "ARS",
          }}
        />
      </div>
    );
  }

  // purchase
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href={`/dashboard/cotizaciones/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al detalle
      </Link>
      <h1 className="text-2xl font-bold">Editar cotización {quotation.code}</h1>
      <QuotationPurchaseForm
        quotationId={quotation.id}
        initialValues={{
          leadId: quotation.leadId ?? "",
          sellerName: quotation.purchaseSellerName ?? "",
          sellerDocument: quotation.purchaseSellerDocument ?? "",
          sellerEmail: quotation.purchaseSellerEmail ?? "",
          sellerPhone: quotation.purchaseSellerPhone ?? "",
          brand: quotation.purchaseBrand ?? "",
          model: quotation.purchaseModel ?? "",
          year: quotation.purchaseYear?.toString() ?? "",
          version: quotation.purchaseVersion ?? "",
          kilometers: quotation.purchaseKilometers?.toString() ?? "",
          color: quotation.purchaseColor ?? "",
          transmission: (quotation.purchaseTransmission as TransmissionType | null) ?? "",
          fuelType: (quotation.purchaseFuelType as FuelType | null) ?? "",
          condition: (quotation.purchaseCondition as VehicleCondition | null) ?? "",
          offerAmount: quotation.purchaseOfferAmount?.toString() ?? "",
          paymentMethod:
            (quotation.purchasePaymentMethod as QuotationPaymentMethod | null) ?? "cash",
          currency: quotation.currency,
          validityDays: String(validityDays || DEFAULT_QUOTATION_VALIDITY_DAYS),
          notes: quotation.notes ?? "",
        }}
      />
    </div>
  );
}
