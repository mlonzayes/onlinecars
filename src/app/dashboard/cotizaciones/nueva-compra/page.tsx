import { QuotationPurchaseForm } from "@/components/dashboard/quotation-purchase-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function NuevaCotizacionCompraPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const leadId = typeof sp.leadId === "string" ? sp.leadId : undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Nueva cotización de compra</h1>
      <QuotationPurchaseForm leadId={leadId} />
    </div>
  );
}
