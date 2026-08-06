import { z } from "zod";
import { vehicleCreateSchema } from "./vehicle";
import { MAX_IMPORT_ROWS } from "@/lib/import/vehicle-columns";

/**
 * Payload del import masivo.
 *
 * Cada item reusa `vehicleCreateSchema` — la validación del servidor es la
 * MISMA que la del alta individual. El preview del cliente es comodidad de UX,
 * no una barrera de seguridad: acá se revalida todo desde cero.
 *
 * `rowNumber` viaja para poder devolver el reporte de errores referenciando la
 * fila real del Excel que vio el usuario.
 */
export const vehicleImportRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  vehicle: vehicleCreateSchema,
});

/**
 * Envelope del request. Las filas entran como `unknown` a propósito: se validan
 * de a una con `vehicleImportRowSchema` para que una fila rota se reporte como
 * omitida en vez de tumbar el lote entero.
 */
export const vehicleImportSchema = z.object({
  rows: z
    .array(z.unknown())
    .min(1, "No hay filas para importar")
    .max(MAX_IMPORT_ROWS, `No se pueden importar más de ${MAX_IMPORT_ROWS} vehículos por vez`),
});

export type VehicleImportRow = z.infer<typeof vehicleImportRowSchema>;
export type VehicleImportInput = z.infer<typeof vehicleImportSchema>;

/** Motivo por el que una fila quedó afuera. Se muestra tal cual en la UI. */
export type SkipReason = "duplicate" | "invalid" | "error";

export interface SkippedRow {
  rowNumber: number;
  reason: SkipReason;
  /** Texto legible para el dealer. Nunca un stack trace ni un error de Prisma crudo. */
  message: string;
  label?: string;
}

export interface ImportResult {
  imported: number;
  skipped: SkippedRow[];
}
