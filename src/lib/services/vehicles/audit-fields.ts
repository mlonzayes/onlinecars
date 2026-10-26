import type { Vehicle } from "@prisma/client";

// Campos que se guardan en la foto de auditoría al crear o borrar un vehículo.
// Los updates registran solo lo que cambió, sea cual sea el campo.
export const VEHICLE_AUDIT_FIELDS = [
  "title",
  "brand",
  "model",
  "year",
  "price",
  "currency",
  "costPrice",
  "costCurrency",
  "kilometers",
  "licensePlate",
  "condition",
  "status",
  "publishedAt",
] as const satisfies readonly (keyof Vehicle)[];
