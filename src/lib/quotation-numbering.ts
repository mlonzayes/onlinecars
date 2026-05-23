import type { Prisma } from "@prisma/client";
import type { QuotationType } from "./constants";

export interface QuotationNumber {
  number: number;
  code: string;
}

/**
 * Reserva el siguiente número correlativo para una cotización dentro de una
 * transacción. La atomicidad la garantiza el `prisma.$transaction` que envuelve
 * la llamada — sin eso podríamos asignar el mismo número a dos cotizaciones
 * concurrentes del mismo dealer/tipo.
 *
 * Estrategia: buscar el counter; si no existe, lo creamos con next=2 y
 * reservamos el 1; si existe, leemos `next`, lo reservamos e incrementamos.
 *
 * IMPORTANTE: llamar SIEMPRE dentro de un prisma.$transaction.
 */
export async function nextQuotationNumber(
  tx: Prisma.TransactionClient,
  dealershipId: string,
  type: QuotationType
): Promise<QuotationNumber> {
  const existing = await tx.quotationCounter.findUnique({
    where: { dealershipId_type: { dealershipId, type } },
  });

  let reservedNumber: number;
  if (!existing) {
    await tx.quotationCounter.create({
      data: { dealershipId, type, next: 2 },
    });
    reservedNumber = 1;
  } else {
    reservedNumber = existing.next;
    await tx.quotationCounter.update({
      where: { dealershipId_type: { dealershipId, type } },
      data: { next: { increment: 1 } },
    });
  }

  const prefix = type === "sale" ? "COT-V" : "COT-C";
  const code = `${prefix}-${String(reservedNumber).padStart(5, "0")}`;

  return { number: reservedNumber, code };
}
