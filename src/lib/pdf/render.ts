import "server-only";
import Printer from "pdfmake/js/Printer";
import virtualfs from "pdfmake/js/virtual-fs";
import URLResolver from "pdfmake/js/URLResolver";
import type { Dealership, Prisma } from "@prisma/client";
import type {
  Currency,
  QuotationPaymentMethod,
  VehicleCondition,
} from "@/lib/constants";
import type { DealershipTheme } from "@/types";
import {
  resolveDealerLogo,
  resolveQuotationLogo,
  resolveVehicleImage,
} from "./logo";
import { buildQuotationDocDefinition } from "./quotation-document";
import type {
  PurchaseQuotationPDFData,
  QuotationPDFData,
  SaleQuotationPDFData,
} from "./types";

export type QuotationForPDF = Prisma.QuotationGetPayload<{
  include: { vehicle: { include: { images: true } } };
}>;

// Planes que muestran foto del auto en lugar del segundo logo del dealer.
const PLANS_WITH_VEHICLE_PHOTO_IN_PDF = new Set(["premium", "enterprise"]);

const DEFAULT_COLOR_PRIMARY = "#2563eb";

// Standard 14 fonts embebidos en pdfkit — no requieren archivos externos.
// pdfmake espera un descriptor con normal/bold/italics/bolditalics.
const FONTS = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};

// pdfmake@0.3+ requiere virtualFs + urlResolver además de las fonts. El
// urlResolver lo usa internamente al procesar los font descriptors (incluso
// si nunca cargamos fonts externas), así que es obligatorio.
const urlResolver = new URLResolver(virtualfs);
const printer = new Printer(FONTS, virtualfs, urlResolver);

function readTheme(theme: Dealership["theme"]): DealershipTheme | null {
  if (!theme || typeof theme !== "object") return null;
  return theme as unknown as DealershipTheme;
}

function decimalToNumber(value: Prisma.Decimal | null): number | null {
  if (value === null) return null;
  return value.toNumber();
}

function buildSaleData(q: QuotationForPDF): SaleQuotationPDFData {
  if (!q.vehicle) {
    throw new Error(
      `Quotation ${q.id} de tipo sale no tiene vehicle cargado en la query`
    );
  }
  return {
    client: {
      name: q.saleClientName ?? "",
      document: q.saleClientDocument,
      email: q.saleClientEmail,
      phone: q.saleClientPhone,
    },
    vehicle: {
      title: q.vehicle.title,
      brand: q.vehicle.brand,
      model: q.vehicle.model,
      year: q.vehicle.year,
      version: null,
      kilometers: q.vehicle.kilometers,
      color: q.vehicle.color,
      transmission: q.vehicle.transmission,
      fuelType: q.vehicle.fuelType,
      condition: q.vehicle.condition as VehicleCondition,
    },
    totalPrice: decimalToNumber(q.saleTotalPrice) ?? 0,
    downPayment: decimalToNumber(q.saleDownPayment),
    installments: q.saleInstallments,
    installmentAmount: decimalToNumber(q.saleInstallmentAmount),
    paymentMethod: (q.salePaymentMethod ?? "cash") as QuotationPaymentMethod,
    sellerName: q.saleSellerName,
    tradeIn:
      q.saleTradeInBrand &&
      q.saleTradeInModel &&
      q.saleTradeInYear &&
      q.saleTradeInValue &&
      q.saleTradeInCurrency
        ? {
            brand: q.saleTradeInBrand,
            model: q.saleTradeInModel,
            year: q.saleTradeInYear,
            value: decimalToNumber(q.saleTradeInValue) ?? 0,
            currency: q.saleTradeInCurrency as Currency,
          }
        : null,
  };
}

function buildPurchaseData(q: QuotationForPDF): PurchaseQuotationPDFData {
  return {
    seller: {
      name: q.purchaseSellerName ?? "",
      document: q.purchaseSellerDocument,
      email: q.purchaseSellerEmail,
      phone: q.purchaseSellerPhone,
    },
    vehicle: {
      brand: q.purchaseBrand ?? "",
      model: q.purchaseModel ?? "",
      year: q.purchaseYear ?? 0,
      version: q.purchaseVersion,
      kilometers: q.purchaseKilometers,
      color: q.purchaseColor,
      transmission: q.purchaseTransmission,
      fuelType: q.purchaseFuelType,
      condition: (q.purchaseCondition as VehicleCondition | null) ?? null,
    },
    offerAmount: decimalToNumber(q.purchaseOfferAmount) ?? 0,
    paymentMethod: (q.purchasePaymentMethod ?? "cash") as QuotationPaymentMethod,
  };
}

export interface RenderQuotationPdfArgs {
  quotation: QuotationForPDF;
  dealership: Dealership;
  appOrigin?: string;
}

export async function renderQuotationPdf({
  quotation,
  dealership,
  appOrigin,
}: RenderQuotationPdfArgs): Promise<Buffer> {
  const origin =
    appOrigin ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const theme = readTheme(dealership.theme);

  // Foto principal del vehículo para el strip — solo si plan habilita la feature
  // Y es una sale (las purchases no tienen vehicle del catálogo). Si todo
  // matchea elegimos la foto isPrimary, sino la de menor `order`.
  const planAllowsVehiclePhoto =
    PLANS_WITH_VEHICLE_PHOTO_IN_PDF.has(dealership.plan);
  let vehiclePrimaryImageUrl: string | null = null;
  if (
    planAllowsVehiclePhoto &&
    quotation.type === "sale" &&
    quotation.vehicle?.images.length
  ) {
    const primary =
      quotation.vehicle.images.find((img) => img.isPrimary) ??
      [...quotation.vehicle.images].sort((a, b) => a.order - b.order)[0];
    vehiclePrimaryImageUrl = primary?.url ?? null;
  }

  // Logos + foto se resuelven en paralelo. Cualquiera que falle queda null y
  // el render cae al fallback que corresponda.
  const [logo, dealerLogo, vehicleImage] = await Promise.all([
    resolveQuotationLogo(dealership, origin),
    resolveDealerLogo(dealership, origin),
    resolveVehicleImage(vehiclePrimaryImageUrl, origin),
  ]);

  const data: QuotationPDFData = {
    type: quotation.type as QuotationPDFData["type"],
    code: quotation.code,
    emittedAt: quotation.emittedAt,
    validUntil: quotation.validUntil,
    currency: quotation.currency as Currency,
    notes: quotation.notes,
    dealership: {
      name: dealership.name,
      address: dealership.address,
      city: dealership.city,
      province: dealership.province,
      phone: dealership.phone,
      email: dealership.email,
      whatsapp: dealership.whatsapp,
    },
    logo,
    dealerLogo,
    vehicleImage,
    showPoweredBy: dealership.plan === "base",
    colorPrimary: theme?.colorPrimary ?? DEFAULT_COLOR_PRIMARY,
    sale: quotation.type === "sale" ? buildSaleData(quotation) : undefined,
    purchase:
      quotation.type === "purchase" ? buildPurchaseData(quotation) : undefined,
  };

  const docDefinition = buildQuotationDocDefinition(data);
  const pdfDoc = await printer.createPdfKitDocument(docDefinition);

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
    pdfDoc.on("error", reject);
    pdfDoc.end();
  });
}
