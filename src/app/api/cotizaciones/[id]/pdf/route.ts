import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { renderQuotationPdf } from "@/lib/pdf/render";

type QuotationParams = { id: string };

// GET /api/cotizaciones/[id]/pdf
// Devuelve el PDF de la cotización con Content-Disposition inline para que
// el browser lo abra en un visor. Si se quiere forzar descarga, agregar
// ?download=1 al request — alterna a attachment.
export const GET = withLogger<QuotationParams>(
  async (request, { requestId, params }) => {
    const { userId } = await auth();
    if (!userId) {
      logger.warn(requestId, "quotations.pdf.unauthorized");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const dealership = await getCurrentDealership();
    if (!dealership) {
      logger.warn(requestId, "quotations.pdf.no_dealership", { userId });
      return NextResponse.json(
        { error: "Concesionario no encontrado" },
        { status: 404 }
      );
    }

    const { id } = params;
    const quotation = await prisma.quotation.findFirst({
      where: { id, dealershipId: dealership.id },
      include: { vehicle: true },
    });

    if (!quotation) {
      logger.warn(requestId, "quotations.pdf.not_found", {
        dealershipId: dealership.id,
        quotationId: id,
      });
      return NextResponse.json(
        { error: "Cotización no encontrada" },
        { status: 404 }
      );
    }

    const buffer = await renderQuotationPdf({ quotation, dealership });

    const { searchParams } = new URL(request.url);
    const disposition = searchParams.get("download") === "1" ? "attachment" : "inline";
    const filename = `${quotation.code}.pdf`;

    logger.info(requestId, "quotations.pdf.ok", {
      dealershipId: dealership.id,
      quotationId: id,
      code: quotation.code,
      sizeBytes: buffer.length,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(buffer.length),
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }
);
