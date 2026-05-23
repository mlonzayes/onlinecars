import type {
  Currency,
  QuotationPaymentMethod,
  QuotationType,
  VehicleCondition,
} from "@/lib/constants";
import type { QuotationLogo } from "./logo";

// Datos planos que consume el componente PDF. La capa de render mapea desde
// el Quotation de Prisma a esta forma — el componente NO sabe de Prisma ni
// de Decimal, todos los montos vienen ya como number.
export interface QuotationPDFData {
  type: QuotationType;
  code: string;
  emittedAt: Date;
  validUntil: Date;
  currency: Currency;
  notes: string | null;

  dealership: {
    name: string;
    address: string | null;
    city: string | null;
    province: string | null;
    phone: string | null;
    email: string | null;
    whatsapp: string | null;
  };

  logo: QuotationLogo;
  // Logo del dealer para mostrar al lado de los datos en el strip. null si
  // el dealer no subió logo o si está en un formato no soportado (WebP, etc).
  dealerLogo: { dataUri: string } | null;
  showPoweredBy: boolean;
  colorPrimary: string;

  sale?: SaleQuotationPDFData;
  purchase?: PurchaseQuotationPDFData;
}

export interface SaleQuotationPDFData {
  client: {
    name: string;
    document: string | null;
    email: string | null;
    phone: string | null;
  };
  vehicle: {
    title: string;
    brand: string;
    model: string;
    year: number;
    version: string | null;
    kilometers: number | null;
    color: string | null;
    transmission: string | null;
    fuelType: string | null;
    condition: VehicleCondition;
  };
  totalPrice: number;
  downPayment: number | null;
  installments: number | null;
  installmentAmount: number | null;
  paymentMethod: QuotationPaymentMethod;
  sellerName: string | null;
  // Permuta — vehículo entregado en parte de pago. null si la cotización no
  // tiene permuta. La moneda puede ser distinta a la del total (típico: total
  // ARS, usado tasado en USD).
  tradeIn: {
    brand: string;
    model: string;
    year: number;
    value: number;
    currency: Currency;
  } | null;
}

export interface PurchaseQuotationPDFData {
  seller: {
    name: string;
    document: string | null;
    email: string | null;
    phone: string | null;
  };
  vehicle: {
    brand: string;
    model: string;
    year: number;
    version: string | null;
    kilometers: number | null;
    color: string | null;
    transmission: string | null;
    fuelType: string | null;
    condition: VehicleCondition | null;
  };
  offerAmount: number;
  paymentMethod: QuotationPaymentMethod;
}
