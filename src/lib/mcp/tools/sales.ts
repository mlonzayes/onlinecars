import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { QUOTATION_STATUSES, SALE_STATUSES } from "@/lib/constants";
import { getSale, listSales, type SaleRow } from "@/lib/services/sales";
import { listQuotations, type QuotationRow } from "@/lib/services/quotations";
import { runTool } from "../run-tool";
import type { McpContext } from "../context";
import { day, money, pageInput, personName } from "./format";

const READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const;

function toSaleView(sale: SaleRow) {
  return {
    id: sale.id,
    estado: sale.status,
    vehiculo: { id: sale.vehicle.id, titulo: sale.vehicle.title, anio: sale.vehicle.year, patente: sale.vehicle.licensePlate },
    cliente: { nombre: personName(sale.customer), telefono: sale.customer.phone, email: sale.customer.email },
    precio: money(sale.salePrice),
    moneda: sale.currency,
    sena: money(sale.depositAmount),
    fechaSena: day(sale.depositDate),
    factura: sale.invoiceNumber,
    fechaFactura: day(sale.invoiceDate),
    fechaEntrega: day(sale.deliveryDate),
    motivoCancelacion: sale.cancelReason,
    notas: sale.notes,
    fechaAlta: day(sale.createdAt),
  };
}

function toQuotationView(q: QuotationRow) {
  const isSale = q.type === "sale";
  return {
    id: q.id,
    codigo: q.code,
    tipo: isSale ? "venta" : "compra",
    estado: q.status,
    moneda: q.currency,
    emitida: day(q.emittedAt),
    validaHasta: day(q.validUntil),
    contraparte: isSale
      ? { nombre: q.saleClientName, telefono: q.saleClientPhone }
      : { nombre: q.purchaseSellerName, telefono: q.purchaseSellerPhone },
    vehiculo: isSale
      ? q.vehicle && { id: q.vehicle.id, titulo: q.vehicle.title, anio: q.vehicle.year }
      : { marca: q.purchaseBrand, modelo: q.purchaseModel, anio: q.purchaseYear },
    monto: money(isSale ? q.saleTotalPrice : q.purchaseOfferAmount),
    formaDePago: isSale ? q.salePaymentMethod : null,
    notas: q.notes,
  };
}

export function registerSalesTools(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    "listar_ventas",
    {
      title: "Listar ventas",
      description:
        "Operaciones de venta, de la más nueva a la más vieja. Estados: draft, reserved (reservada), in_progress, " +
        "completed, cancelled. Con entregas_proximos_dias trae solo las entregas programadas en ese plazo " +
        "(e ignora el filtro de estado).",
      inputSchema: z.object({
        estado: z.enum(SALE_STATUSES).optional(),
        entregas_proximos_dias: z.number().int().min(1).max(90).optional(),
        pagina: pageInput,
      }),
      annotations: READ_ONLY,
    },
    (input) =>
      runTool(ctx, "listar_ventas", async () => {
        const { items, ...meta } = await listSales(ctx, {
          page: input.pagina,
          status: input.estado,
          deliveryWithinDays: input.entregas_proximos_dias,
        });
        return { ...meta, ventas: items.map(toSaleView) };
      })
  );

  server.registerTool(
    "ver_venta",
    {
      title: "Ver venta",
      description: "Detalle de una venta: vehículo, cliente, precio, seña, factura y entrega.",
      inputSchema: z.object({ venta_id: z.string().min(1) }),
      annotations: READ_ONLY,
    },
    ({ venta_id }) => runTool(ctx, "ver_venta", async () => toSaleView(await getSale(ctx, venta_id)))
  );

  server.registerTool(
    "listar_cotizaciones",
    {
      title: "Listar cotizaciones",
      description:
        "Cotizaciones emitidas, de venta (a un cliente) o de compra (oferta por un auto usado). " +
        "Estados: pending (esperando respuesta), accepted, rejected, expired.",
      inputSchema: z.object({
        estado: z.enum(QUOTATION_STATUSES).optional(),
        tipo: z.enum(["sale", "purchase"]).optional().describe("sale = venta, purchase = compra."),
        pagina: pageInput,
      }),
      annotations: READ_ONLY,
    },
    (input) =>
      runTool(ctx, "listar_cotizaciones", async () => {
        const { items, ...meta } = await listQuotations(ctx, {
          page: input.pagina,
          status: input.estado,
          type: input.tipo,
        });
        return { ...meta, cotizaciones: items.map(toQuotationView) };
      })
  );
}
