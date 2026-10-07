import { z } from "zod";
import { VEHICLE_STATUSES } from "@/lib/constants";
import { vehicleCreateSchema, vehicleUpdateSchema } from "@/lib/validators/vehicle";

// Schemas de entrada de las tools de vehículos. Reusan los validadores del
// panel (misma regla en los dos canales) y suman descripciones para la IA.
// No exponen status/featured/publishedAt: publicar y cambiar estado van por
// tools propias, con sus guards.

const FIELD_HINTS = {
  title: "Título comercial completo. Ej: 'Toyota Corolla XEi 2.0 CVT 2021'.",
  price: "Precio de venta como número, sin puntos ni símbolos. Ej: 22500.",
  currency: "Moneda del precio: ARS (pesos) o USD (dólares). Si el usuario dice 'dólares' o 'U$S', es USD.",
  kilometers: "Kilometraje como número entero. Ej: 45000.",
  description:
    "Descripción pública para el sitio, en español, máximo 2000 caracteres. Usá SOLO datos que dio el usuario: " +
    "nunca inventes equipamiento, historial de dueños, services ni estado.",
  costPrice: "Precio de compra (privado, no se publica). Solo lo puede cargar un administrador.",
  costCurrency: "Moneda del precio de compra: ARS o USD.",
} as const;

const PUBLIC_EDITABLE = { status: true, featured: true, unlimitedStock: true } as const;

const describedCreate = vehicleCreateSchema.omit(PUBLIC_EDITABLE).extend({
  title: vehicleCreateSchema.shape.title.describe(FIELD_HINTS.title),
  price: vehicleCreateSchema.shape.price.describe(FIELD_HINTS.price),
  currency: vehicleCreateSchema.shape.currency.describe(FIELD_HINTS.currency),
  kilometers: vehicleCreateSchema.shape.kilometers.describe(FIELD_HINTS.kilometers),
  description: vehicleCreateSchema.shape.description.describe(FIELD_HINTS.description),
  costPrice: vehicleCreateSchema.shape.costPrice.describe(FIELD_HINTS.costPrice),
  costCurrency: vehicleCreateSchema.shape.costCurrency.describe(FIELD_HINTS.costCurrency),
});

export const createVehicleToolSchema = describedCreate;

const vehicleIdField = z.string().min(1).describe("ID del vehículo (sale de buscar_vehiculos).");

export const updateVehicleToolSchema = vehicleUpdateSchema
  .omit({ ...PUBLIC_EDITABLE, publishedAt: true })
  .extend({
    vehiculo_id: vehicleIdField,
    price: vehicleUpdateSchema.shape.price.describe(FIELD_HINTS.price),
    currency: vehicleUpdateSchema.shape.currency.describe(FIELD_HINTS.currency),
    description: vehicleUpdateSchema.shape.description.describe(FIELD_HINTS.description),
    costPrice: vehicleUpdateSchema.shape.costPrice.describe(FIELD_HINTS.costPrice),
  });

export const vehicleIdToolSchema = z.object({ vehiculo_id: vehicleIdField });

export const searchVehiclesToolSchema = z.object({
  texto: z.string().max(100).optional().describe("Busca en título, marca y modelo. Ej: 'corolla'."),
  estado: z.enum(VEHICLE_STATUSES).optional().describe("available = disponible, reserved = reservado, sold = vendido."),
  pagina: z.number().int().min(1).default(1),
});
