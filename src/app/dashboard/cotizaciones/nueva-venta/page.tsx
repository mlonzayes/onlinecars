import { QuotationSaleForm } from "@/components/dashboard/quotation-sale-form";

export default function NuevaCotizacionVentaPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Nueva cotización de venta</h1>
      <QuotationSaleForm />
    </div>
  );
}
