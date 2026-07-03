import type { QuotationPaymentMethod } from "@/lib/constants";

// El formatCurrency global de utils.ts usa 0 decimales por la convención visual
// de la UI. Para PDFs de cotización mostramos 2 decimales — son documentos
// comerciales y los montos exactos importan (cuotas, anticipos).
export function formatMoney(
  amount: number | string | { toString(): string },
  currency: string = "ARS"
): string {
  const num =
    typeof amount === "number"
      ? amount
      : Number(typeof amount === "string" ? amount : amount.toString());
  if (Number.isNaN(num)) return "-";

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export const PAYMENT_METHOD_LABELS: Record<QuotationPaymentMethod, string> = {
  cash: "Contado",
  financed: "Financiado",
  mixed: "Mixto",
};
