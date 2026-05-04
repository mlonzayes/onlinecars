import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { SaleDetailClient } from "@/components/dashboard/sale-detail-client";

export default async function VentaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/onboarding");

  const sale = await prisma.sale.findFirst({
    where: { id, dealershipId: dealership.id },
    include: {
      customer: {
        select: {
          id: true,
          type: true,
          firstName: true,
          lastName: true,
          businessName: true,
          documentType: true,
          documentNumber: true,
          email: true,
          phone: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          title: true,
          brand: true,
          model: true,
          year: true,
          licensePlate: true,
          vin: true,
        },
      },
      documents: {
        orderBy: [{ category: "asc" }, { uploadedAt: "desc" }],
      },
    },
  });

  if (!sale) notFound();

  // Serializar Decimal y Date antes de pasar al Client Component.
  const serializedSale = {
    ...sale,
    salePrice: sale.salePrice.toString(),
    depositAmount: sale.depositAmount?.toString() ?? null,
    createdAt: sale.createdAt.toISOString(),
    updatedAt: sale.updatedAt.toISOString(),
    depositDate: sale.depositDate?.toISOString() ?? null,
    invoiceDate: sale.invoiceDate?.toISOString() ?? null,
    deliveryDate: sale.deliveryDate?.toISOString() ?? null,
    customer: sale.customer,
    vehicle: sale.vehicle,
  };

  const serializedDocuments = sale.documents.map((doc) => ({
    id: doc.id,
    category: doc.category,
    type: doc.type,
    url: doc.url,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    notes: doc.notes,
    issuedAt: doc.issuedAt?.toISOString() ?? null,
    expiresAt: doc.expiresAt?.toISOString() ?? null,
    uploadedAt: doc.uploadedAt.toISOString(),
  }));

  return <SaleDetailClient sale={serializedSale} documents={serializedDocuments} />;
}
