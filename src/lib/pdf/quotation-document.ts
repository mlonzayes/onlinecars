import type {
  Column,
  Content,
  ContentStack,
  TDocumentDefinitions,
} from "pdfmake/interfaces";
import {
  FUEL_TYPE_LABELS,
  TRANSMISSION_TYPE_LABELS,
  VEHICLE_CONDITION_LABELS,
  type FuelType,
  type TransmissionType,
  type VehicleCondition,
} from "@/lib/constants";
import { PAYMENT_METHOD_LABELS, formatDate, formatMoney } from "./format";
import type { QuotationPDFData } from "./types";

const COLORS = {
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  surface: "#f8fafc",
  footerAccent: "#cbd5e1", // gris para la barra del footer (sin colorPrimary)
};

/**
 * Construye el docDefinition de pdfmake para una cotización (sale o purchase).
 * pdfmake recibe esto y produce un PDF — sin React, sin JSX, sin reconcilers.
 *
 * La estructura es:
 *   [header repetido en cada página] logo motorflow + título + código
 *   [content]                        strip del dealer (con logo si tiene) +
 *                                    fechas + secciones + notas
 *   [footer repetido en cada página] accent gris + powered-by + paginación
 */
export function buildQuotationDocDefinition(
  data: QuotationPDFData
): TDocumentDefinitions {
  const isSale = data.type === "sale";
  const title = isSale ? "Cotización de venta" : "Cotización de compra";

  return {
    pageSize: "A4",
    // [left, top, right, bottom] — top alto para el header repetido
    pageMargins: [40, 110, 40, 60],
    info: {
      title: `${data.code} - ${data.dealership.name}`,
      author: data.dealership.name,
      subject: title,
    },
    defaultStyle: {
      font: "Helvetica",
      fontSize: 10,
      color: COLORS.text,
      lineHeight: 1.3,
    },
    header: buildPageHeader(data, title),
    footer: buildPageFooter(data),
    content: [
      buildDealershipStrip(data),
      buildDatesStrip(data),
      ...(isSale ? buildSaleContent(data) : buildPurchaseContent(data)),
      ...buildNotesBlock(data.notes),
    ],
    styles: {
      docTitle: {
        fontSize: 14,
        bold: true,
        characterSpacing: 0.5,
      },
      docCode: { fontSize: 12, bold: true },
      metaLabel: { color: COLORS.muted, fontSize: 9 },
      metaValue: { fontSize: 9 },
      sectionTitle: {
        fontSize: 10,
        bold: true,
        color: COLORS.muted,
        characterSpacing: 0.5,
        margin: [0, 12, 0, 6],
      },
      fieldLabel: {
        fontSize: 8,
        color: COLORS.muted,
        characterSpacing: 0.4,
      },
      fieldValue: { fontSize: 10 },
      grandLabel: { fontSize: 11, bold: true },
      grandValue: { fontSize: 13, bold: true },
    },
  };
}

// ─── Header (repite en cada página) ────────────────────────────────────────

function buildPageHeader(data: QuotationPDFData, title: string): Content {
  return {
    margin: [40, 30, 40, 0],
    columns: [
      {
        image: data.logo.dataUri,
        fit: [130, 50],
      },
      {
        stack: [
          { text: title.toUpperCase(), style: "docTitle", alignment: "right" },
          {
            text: data.code,
            style: "docCode",
            color: data.colorPrimary,
            alignment: "right",
            margin: [0, 2, 0, 0],
          },
        ],
        alignment: "right",
      },
    ],
  };
}

// ─── Footer (repite en cada página) ────────────────────────────────────────

function buildPageFooter(data: QuotationPDFData) {
  return (currentPage: number, pageCount: number): Content => ({
    margin: [40, 0, 40, 20],
    stack: [
      {
        canvas: [
          {
            type: "rect",
            x: 0,
            y: 0,
            w: 515,
            h: 1,
            color: COLORS.footerAccent,
          },
        ],
      },
      data.showPoweredBy
        ? {
            text: "Powered by motorflow",
            alignment: "center",
            fontSize: 8,
            color: COLORS.muted,
            margin: [0, 6, 0, 0],
          }
        : { text: "", margin: [0, 6, 0, 0] },
      {
        text: `Página ${currentPage} de ${pageCount}`,
        alignment: "right",
        fontSize: 8,
        color: COLORS.muted,
        margin: [0, 2, 0, 0],
      },
    ],
  });
}

// ─── Strip del concesionario (con logo opcional al costado) ────────────────

function buildDealershipStrip(data: QuotationPDFData): Content {
  const d = data.dealership;
  const location = [d.city, d.province].filter(Boolean).join(", ");
  const addressLine =
    d.address && location
      ? `${d.address}  ·  ${location}`
      : d.address || location || null;

  const contactParts: string[] = [];
  if (d.phone) contactParts.push(`Tel: ${d.phone}`);
  if (d.whatsapp) contactParts.push(`WhatsApp: ${d.whatsapp}`);
  if (d.email) contactParts.push(`Email: ${d.email}`);
  const contactLine = contactParts.length ? contactParts.join("  ·  ") : null;

  const dataStack: Content[] = [{ text: d.name, bold: true, fontSize: 11 }];
  if (addressLine) {
    dataStack.push({
      text: addressLine,
      fontSize: 9,
      color: COLORS.muted,
      margin: [0, 2, 0, 0],
    });
  }
  if (contactLine) {
    dataStack.push({
      text: contactLine,
      fontSize: 9,
      color: COLORS.muted,
      margin: [0, 1, 0, 0],
    });
  }

  // Orden de preferencia para el visual del lado izquierdo del strip:
  //   1) vehicleImage — solo en planes premium/enterprise (resuelto en render.ts).
  //      Es la foto principal del auto, más vendedora que el logo repetido.
  //   2) dealerLogo — fallback estándar para media (y para premium sin fotos).
  //   3) sin imagen — datos del dealer ocupan todo el ancho.
  // Dos returns en lugar de un spread porque el tipo `Content` de pdfmake es
  // union y no spreads limpio con extras de TableCell (border/fillColor/margin).
  const sideImage = data.vehicleImage ?? data.dealerLogo;
  if (sideImage) {
    // Foto del auto: usamos un thumbnail más grande (caja vs logo chico).
    const isVehiclePhoto = data.vehicleImage !== null;
    const imageFit: [number, number] = isVehiclePhoto ? [110, 70] : [70, 50];
    const imageColWidth = isVehiclePhoto ? 120 : 75;
    return {
      table: {
        widths: ["*"],
        body: [
          [
            {
              columns: [
                {
                  image: sideImage.dataUri,
                  fit: imageFit,
                  width: imageColWidth,
                },
                { stack: dataStack, width: "*" },
              ],
              columnGap: 12,
              border: [false, false, false, false],
              fillColor: COLORS.surface,
              margin: [10, 10, 10, 10],
            },
          ],
        ],
      },
      layout: "noBorders",
      margin: [0, 0, 0, 4],
    };
  }

  return {
    table: {
      widths: ["*"],
      body: [
        [
          {
            stack: dataStack,
            border: [false, false, false, false],
            fillColor: COLORS.surface,
            margin: [10, 10, 10, 10],
          },
        ],
      ],
    },
    layout: "noBorders",
    margin: [0, 0, 0, 4],
  };
}

// ─── Strip de fechas (debajo del dealer, antes del contenido) ──────────────

function buildDatesStrip(data: QuotationPDFData): Content {
  return {
    columns: [
      {
        text: [
          { text: "Emitida: ", style: "metaLabel" },
          { text: formatDate(data.emittedAt), style: "metaValue" },
        ],
        width: "*",
      },
      {
        text: [
          { text: "Válida hasta: ", style: "metaLabel" },
          { text: formatDate(data.validUntil), style: "metaValue" },
        ],
        width: "*",
        alignment: "right",
      },
    ],
    margin: [0, 6, 0, 10],
  };
}

// ─── Sale ──────────────────────────────────────────────────────────────────

function buildSaleContent(data: QuotationPDFData): Content[] {
  const sale = data.sale!;
  // `topGap` extra ANTES del primer item ("Cliente") — el cuerpo necesita un
  // respiro después del strip del dealer + fechas.
  const topGap: Content = { text: "", margin: [0, 8, 0, 0] };

  return [
    topGap,
    section("Cliente", twoColGrid([
      field("Nombre", sale.client.name),
      field("Documento", sale.client.document),
      field("Email", sale.client.email),
      field("Teléfono", sale.client.phone),
    ])),
    section("Vehículo", [
      twoColGrid([field("Detalle", sale.vehicle.title)], { single: true }),
      twoColGrid([
        field("Marca", sale.vehicle.brand),
        field("Modelo", sale.vehicle.model),
        field("Año", String(sale.vehicle.year)),
        field("Versión", sale.vehicle.version),
        field(
          "Kilometraje",
          sale.vehicle.kilometers !== null
            ? `${sale.vehicle.kilometers.toLocaleString("es-AR")} km`
            : null
        ),
        field("Color", sale.vehicle.color),
        field(
          "Transmisión",
          sale.vehicle.transmission
            ? TRANSMISSION_TYPE_LABELS[sale.vehicle.transmission as TransmissionType]
            : null
        ),
        field(
          "Combustible",
          sale.vehicle.fuelType
            ? FUEL_TYPE_LABELS[sale.vehicle.fuelType as FuelType]
            : null
        ),
        field(
          "Condición",
          VEHICLE_CONDITION_LABELS[sale.vehicle.condition as VehicleCondition]
        ),
      ]),
    ]),
    ...(sale.tradeIn ? buildTradeInSection(sale.tradeIn) : []),
    section("Condiciones comerciales", [
      twoColGrid([
        field("Forma de pago", PAYMENT_METHOD_LABELS[sale.paymentMethod]),
        field("Vendedor", sale.sellerName),
      ]),
      buildSaleTotalsBox(data),
    ]),
  ];
}

// ─── Sale: permuta ─────────────────────────────────────────────────────────

function buildTradeInSection(
  tradeIn: NonNullable<QuotationPDFData["sale"]>["tradeIn"]
): Content[] {
  if (!tradeIn) return [];
  return section("Vehículo entregado en parte de pago", [
    twoColGrid([
      field("Marca", tradeIn.brand),
      field("Modelo", tradeIn.model),
      field("Año", String(tradeIn.year)),
      field(
        "Valor tomado",
        `${formatMoney(tradeIn.value, tradeIn.currency)} ${tradeIn.currency}`
      ),
    ]),
  ]);
}

function buildSaleTotalsBox(data: QuotationPDFData): Content {
  const sale = data.sale!;
  // Solo agregamos el sufijo de moneda cuando es DISTINTA de la moneda de la
  // cotización — único caso donde el dato es necesario (típico: venta ARS,
  // usado tasado en USD). Si no aclaramos, las cifras se asumen en la moneda
  // del documento (mostrada en el header) y todos los importes quedan
  // alineados a la misma columna derecha.
  const rows: Array<[string, string]> = [];

  if (sale.tradeIn) {
    const tradeInIsDifferentCurrency = sale.tradeIn.currency !== data.currency;
    const tradeInAmount = formatMoney(sale.tradeIn.value, sale.tradeIn.currency);
    rows.push([
      `Entrega ${sale.tradeIn.brand} ${sale.tradeIn.model} ${sale.tradeIn.year}`,
      tradeInIsDifferentCurrency
        ? `${tradeInAmount} ${sale.tradeIn.currency}`
        : tradeInAmount,
    ]);
  }
  if (sale.downPayment !== null && sale.downPayment > 0) {
    rows.push(["Anticipo", formatMoney(sale.downPayment, data.currency)]);
  }
  if (
    sale.installments !== null &&
    sale.installments > 0 &&
    sale.installmentAmount !== null
  ) {
    rows.push([
      `${sale.installments} cuotas de`,
      formatMoney(sale.installmentAmount, data.currency),
    ]);
  }

  const body: Content[] = rows.map(([label, value]) => ({
    columns: [
      { text: label, color: COLORS.muted, fontSize: 10 },
      { text: value, alignment: "right", bold: true, fontSize: 11 },
    ],
    margin: [0, 2, 0, 2],
  }));

  // separador antes del total
  body.push({
    canvas: [
      { type: "line", x1: 0, y1: 4, x2: 495, y2: 4, lineWidth: 0.5, lineColor: COLORS.border },
    ],
  });

  // Total sin color del theme — queda en color de texto default. La idea es
  // que el PDF se vea sobrio independientemente del branding del dealer.
  // Sin sufijo de moneda para alinear con el resto del bloque; el documento
  // ya indica la moneda en el header del bloque (formato del precio).
  body.push({
    columns: [
      { text: "Total", style: "grandLabel" },
      {
        text: formatMoney(sale.totalPrice, data.currency),
        style: "grandValue",
        alignment: "right",
      },
    ],
    margin: [0, 6, 0, 0],
  });

  return {
    table: {
      widths: ["*"],
      body: [[{ stack: body, border: [false, false, false, false], fillColor: COLORS.surface, margin: [12, 10, 12, 10] }]],
    },
    layout: "noBorders",
    margin: [0, 6, 0, 0],
  };
}

// ─── Purchase ──────────────────────────────────────────────────────────────

function buildPurchaseContent(data: QuotationPDFData): Content[] {
  const purchase = data.purchase!;
  const condition =
    purchase.vehicle.condition === "new"
      ? "Nuevo"
      : purchase.vehicle.condition === "used"
        ? "Usado"
        : null;
  const topGap: Content = { text: "", margin: [0, 8, 0, 0] };

  return [
    topGap,
    section("Vendedor", twoColGrid([
      field("Nombre", purchase.seller.name),
      field("Documento", purchase.seller.document),
      field("Email", purchase.seller.email),
      field("Teléfono", purchase.seller.phone),
    ])),
    section("Vehículo a comprar", twoColGrid([
      field("Marca", purchase.vehicle.brand),
      field("Modelo", purchase.vehicle.model),
      field("Año", String(purchase.vehicle.year)),
      field("Versión", purchase.vehicle.version),
      field(
        "Kilometraje",
        purchase.vehicle.kilometers !== null
          ? `${purchase.vehicle.kilometers.toLocaleString("es-AR")} km`
          : null
      ),
      field("Color", purchase.vehicle.color),
      field(
        "Transmisión",
        purchase.vehicle.transmission
          ? TRANSMISSION_TYPE_LABELS[purchase.vehicle.transmission as TransmissionType]
          : null
      ),
      field(
        "Combustible",
        purchase.vehicle.fuelType
          ? FUEL_TYPE_LABELS[purchase.vehicle.fuelType as FuelType]
          : null
      ),
      field("Condición", condition),
    ])),
    section("Oferta de compra", [
      twoColGrid([
        field("Forma de pago", PAYMENT_METHOD_LABELS[purchase.paymentMethod]),
      ]),
      {
        table: {
          widths: ["*"],
          body: [[{
            stack: [{
              columns: [
                { text: "Oferta", style: "grandLabel" },
                {
                  text: `${formatMoney(purchase.offerAmount, data.currency)} ${data.currency}`,
                  style: "grandValue",
                  alignment: "right",
                },
              ],
            }],
            border: [false, false, false, false],
            fillColor: COLORS.surface,
            margin: [12, 10, 12, 10],
          }]],
        },
        layout: "noBorders",
        margin: [0, 6, 0, 0],
      },
    ]),
  ];
}

// ─── Notas ─────────────────────────────────────────────────────────────────

function buildNotesBlock(notes: string | null): Content[] {
  if (!notes) return [];
  return [
    { text: "OBSERVACIONES", style: "sectionTitle" },
    {
      table: {
        widths: [3, "*"],
        body: [[
          { text: "", fillColor: COLORS.border, border: [false, false, false, false] },
          {
            text: notes,
            fontSize: 9,
            border: [false, false, false, false],
            margin: [8, 0, 0, 0],
          },
        ]],
      },
      layout: "noBorders",
    },
  ];
}

// ─── Helpers de layout ─────────────────────────────────────────────────────

function section(title: string, children: Content[] | Content): Content[] {
  const sep = {
    canvas: [
      {
        type: "line" as const,
        x1: 0,
        y1: 2,
        x2: 515,
        y2: 2,
        lineWidth: 0.5,
        lineColor: COLORS.border,
      },
    ],
    margin: [0, 0, 0, 4] as [number, number, number, number],
  };
  return [
    { text: title.toUpperCase(), style: "sectionTitle" },
    sep,
    ...(Array.isArray(children) ? children : [children]),
  ];
}

/**
 * Convierte una lista plana de fields (label+value) en una grilla de 2
 * columnas. Si `single` es true, ocupa una sola columna de ancho completo.
 * Las celdas vacías (value null) quedan como placeholders invisibles para
 * mantener la alineación de la grilla.
 */
function twoColGrid(
  fields: Array<ContentStack | null>,
  opts: { single?: boolean } = {}
): Content {
  const visible = fields.filter((f): f is ContentStack => f !== null);
  if (visible.length === 0) return { text: "" };

  if (opts.single) {
    return { stack: visible, margin: [0, 0, 0, 4] };
  }

  // Agrupar de a 2
  const rows: Content[] = [];
  for (let i = 0; i < visible.length; i += 2) {
    const left = visible[i];
    const right = visible[i + 1];
    const columns: Column[] = [
      { ...left, width: "*" },
    ];
    if (right) {
      columns.push({ ...right, width: "*" });
    } else {
      columns.push({ text: "", width: "*" });
    }
    rows.push({
      columns,
      columnGap: 16,
      margin: [0, 0, 0, 4],
    });
  }
  return { stack: rows };
}

function field(label: string, value: string | null | undefined): ContentStack | null {
  if (value === null || value === undefined || value === "") return null;
  return {
    stack: [
      { text: label.toUpperCase(), style: "fieldLabel" },
      { text: value, style: "fieldValue", margin: [0, 1, 0, 0] },
    ],
  };
}
