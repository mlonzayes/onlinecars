import { z } from "zod";
import { VEHICLE_STATUSES } from "../constants";

// Límite máximo de items por operación bulk. Es defense in depth contra:
// - Errores del cliente (mandar IDs duplicados / cantidades absurdas)
// - Abuso interno (un user mal intencionado borra todo el stock)
// - Timeouts de la DB (operaciones masivas se vuelven lentas con N grande)
export const BULK_MAX_ITEMS = 50;

const idsSchema = z
  .array(z.string().min(1))
  .min(1, "Necesitás seleccionar al menos un vehículo")
  .max(BULK_MAX_ITEMS, `Máximo ${BULK_MAX_ITEMS} items por operación`);

// Discriminated union: el `action` determina qué otros campos vienen.
// Esto evita aceptar combinaciones inválidas tipo `action: "delete"` con `status`.
export const vehicleBulkSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("delete"),
    ids: idsSchema,
  }),
  z.object({
    action: z.literal("status"),
    ids: idsSchema,
    status: z.enum(VEHICLE_STATUSES),
  }),
  z.object({
    action: z.literal("publish"),
    ids: idsSchema,
    value: z.boolean(),
  }),
  z.object({
    action: z.literal("featured"),
    ids: idsSchema,
    value: z.boolean(),
  }),
]);

export type VehicleBulkInput = z.infer<typeof vehicleBulkSchema>;
