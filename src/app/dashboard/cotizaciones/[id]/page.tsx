import { notFound, redirect } from "next/navigation";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  QuotationDetailClient,
  type QuotationDetail,
} from "@/components/dashboard/quotation-detail-client";
import { decorateWithExpired } from "@/lib/quotation-status";
import type { QuotationType } from "@/lib/constants";

export default async function CotizacionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
          kilometers: true,
          color: true,
          transmission: true,
          fuelType: true,
          condition: true,
        },
      },
      lead: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  if (!quotation) notFound();

  const decorated = decorateWithExpired(quotation);

  // Serializar Decimal y Date al borde del Client Component.
  const data: QuotationDetail = {
    id: quotation.id,
    type: quotation.type as QuotationType,
    code: quotation.code,
    status: quotation.status,
    effectiveStatus: decorated.effectiveStatus,
    currency: quotation.currency,
    validUntil: quotation.validUntil.toISOString(),
    emittedAt: quotation.emittedAt.toISOString(),
    notes: quotation.notes,

    saleClientName: quotation.saleClientName,
    saleClientDocument: quotation.saleClientDocument,
    saleClientEmail: quotation.saleClientEmail,
    saleClientPhone: quotation.saleClientPhone,
    saleTotalPrice: quotation.saleTotalPrice?.toString() ?? null,
    saleDownPayment: quotation.saleDownPayment?.toString() ?? null,
    saleInstallments: quotation.saleInstallments,
    saleInstallmentAmount: quotation.saleInstallmentAmount?.toString() ?? null,
    salePaymentMethod: quotation.salePaymentMethod,
    saleSellerName: quotation.saleSellerName,
    saleTradeInBrand: quotation.saleTradeInBrand,
    saleTradeInModel: quotation.saleTradeInModel,
    saleTradeInYear: quotation.saleTradeInYear,
    saleTradeInValue: quotation.saleTradeInValue?.toString() ?? null,
    saleTradeInCurrency: quotation.saleTradeInCurrency,

    purchaseSellerName: quotation.purchaseSellerName,
    purchaseSellerDocument: quotation.purchaseSellerDocument,
    purchaseSellerEmail: quotation.purchaseSellerEmail,
    purchaseSellerPhone: quotation.purchaseSellerPhone,
    purchaseBrand: quotation.purchaseBrand,
    purchaseModel: quotation.purchaseModel,
    purchaseYear: quotation.purchaseYear,
    purchaseVersion: quotation.purchaseVersion,
    purchaseKilometers: quotation.purchaseKilometers,
    purchaseColor: quotation.purchaseColor,
    purchaseFuelType: quotation.purchaseFuelType,
    purchaseTransmission: quotation.purchaseTransmission,
    purchaseCondition: quotation.purchaseCondition,
    purchaseOfferAmount: quotation.purchaseOfferAmount?.toString() ?? null,
    purchasePaymentMethod: quotation.purchasePaymentMethod,

    vehicle: quotation.vehicle ?? null,
    lead: quotation.lead ?? null,
  };

  return <QuotationDetailClient quotation={data} />;
}
