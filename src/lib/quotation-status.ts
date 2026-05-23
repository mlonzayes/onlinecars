import type { Prisma, Quotation } from "@prisma/client";
import type { QuotationStatus } from "./constants";

/**
 * Computa el status efectivo de una cotización. `expired` se deriva en lectura:
 * si `validUntil < now` y el status persistido es "pending", se reporta
 * "expired" sin modificar el valor en DB. Esto evita un job de housekeeping
 * y mantiene la fuente de verdad simple (solo cambian estados por acción
 * explícita del usuario).
 */
export function effectiveStatus(
  quotation: Pick<Quotation, "status" | "validUntil">
): QuotationStatus {
  if (quotation.status === "pending" && quotation.validUntil < new Date()) {
    return "expired";
  }
  return quotation.status as QuotationStatus;
}

/**
 * Decora una cotización con su `effectiveStatus`. Útil para serializar a la UI
 * sin mutar el objeto original ni perder los campos del cliente Prisma.
 */
export function decorateWithExpired<
  T extends Pick<Quotation, "status" | "validUntil">,
>(quotation: T): T & { effectiveStatus: QuotationStatus } {
  return {
    ...quotation,
    effectiveStatus: effectiveStatus(quotation),
  };
}

/**
 * Tira `QuotationNotEditableError` si la cotización NO es editable. Se considera
 * editable únicamente cuando el status persistido es "pending" — independiente
 * de si está expirada o no (una cotización expirada sigue siendo "pending"
 * en DB y se puede extender modificando `validUntil`).
 */
export function assertEditable(quotation: Pick<Quotation, "status">): void {
  if (quotation.status !== "pending") {
    throw new QuotationNotEditableError(quotation.status);
  }
}

export class QuotationNotEditableError extends Error {
  constructor(public readonly currentStatus: string) {
    super(`No se puede editar una cotización con estado "${currentStatus}"`);
    this.name = "QuotationNotEditableError";
  }
}

/**
 * Traduce un filtro por `effectiveStatus` a un WHERE de Prisma. Lo necesitamos
 * porque `expired` no vive en DB — se deriva comparando `validUntil` con `now`.
 *
 * - pending  → status="pending" AND validUntil >= now
 * - expired  → status="pending" AND validUntil <  now
 * - accepted → status="accepted"
 * - rejected → status="rejected"
 */
export function effectiveStatusFilter(
  status: QuotationStatus | undefined,
  now: Date = new Date()
): Prisma.QuotationWhereInput {
  switch (status) {
    case "pending":
      return { status: "pending", validUntil: { gte: now } };
    case "expired":
      return { status: "pending", validUntil: { lt: now } };
    case "accepted":
    case "rejected":
      return { status };
    default:
      return {};
  }
}
