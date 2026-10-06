import { z } from "zod";
import type { Prisma } from "@prisma/client";

// Formato común de lo que ven las tools: montos como string (sin perder
// precisión del Decimal) y fechas como YYYY-MM-DD.
export function money(value: Prisma.Decimal | null | undefined): string | null {
  return value ? value.toString() : null;
}

export function day(value: Date | null | undefined): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

export const pageInput = z.number().int().min(1).default(1).describe("Página de resultados (de a 20).");

export function personName(p: { firstName: string; lastName: string | null; businessName: string | null }): string {
  return p.businessName ?? [p.firstName, p.lastName].filter(Boolean).join(" ");
}
