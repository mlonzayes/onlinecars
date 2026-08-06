import {
  CURRENCIES,
  FUEL_TYPE_LABELS,
  TRANSMISSION_TYPE_LABELS,
  VEHICLE_BODY_TYPE_LABELS,
  VEHICLE_CONDITION_LABELS,
  VEHICLE_STATUS_LABELS,
} from "@/lib/constants";
import { buildOptions, labelList, normalizeKey, type ImportColumn } from "./import-config";

// Re-export para que los consumidores sigan importando todo desde un solo lugar.
export {
  IMPORT_CHUNK_SIZE,
  MAX_IMPORT_ROWS,
  normalizeKey,
  parseBooleanCell,
  type ImportColumn,
  type ImportFieldType,
} from "./import-config";

// Solo códigos ISO. Deliberadamente NO aceptamos "pesos" como alias: con MXN,
// CLP, COP y UYU en juego, "pesos" es ambiguo y adivinar mal el precio de un
// auto es un error caro. Si la celda viene vacía se usa la moneda del dealer.
const CURRENCY_OPTIONS: Record<string, string> = Object.fromEntries(
  CURRENCIES.map((c) => [normalizeKey(c), c])
);

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Definición de las columnas del Excel de importación.
 *
 * El orden acá es el orden de la plantilla generada. Los headers están en
 * español (los lee el dealer) y las keys en inglés (matchean el modelo Prisma),
 * siguiendo el split de idiomas del proyecto.
 */
export const VEHICLE_IMPORT_COLUMNS: ImportColumn[] = [
  {
    key: "title",
    header: "Título",
    type: "text",
    required: true,
    example: "Toyota Corolla XEI 2.0 CVT",
    maxLength: 200,
    hint: "Mínimo 3 caracteres. Es el nombre que se ve en el catálogo.",
  },
  {
    key: "brand",
    header: "Marca",
    type: "text",
    required: true,
    example: "Toyota",
    maxLength: 100,
  },
  {
    key: "model",
    header: "Modelo",
    type: "text",
    required: true,
    example: "Corolla",
    maxLength: 100,
  },
  {
    key: "year",
    header: "Año",
    type: "integer",
    required: true,
    example: "2023",
    min: 1900,
    max: CURRENT_YEAR + 1,
    hint: `Entre 1900 y ${CURRENT_YEAR + 1}.`,
  },
  {
    key: "price",
    header: "Precio",
    type: "decimal",
    required: true,
    example: "25000000",
    min: 0,
    hint: "Solo el número, sin símbolo de moneda ni separadores de miles.",
  },
  {
    key: "currency",
    header: "Moneda",
    type: "enum",
    example: "ARS",
    options: CURRENCY_OPTIONS,
    hint: `${CURRENCIES.join(" · ")}. Si se deja vacío se usa la moneda del concesionario.`,
  },
  {
    key: "costPrice",
    header: "Precio de costo",
    type: "decimal",
    example: "20000000",
    min: 0,
    hint: "Solo administradores. Si lo carga otro rol, se ignora.",
  },
  {
    key: "costCurrency",
    header: "Moneda del costo",
    type: "enum",
    example: "USD",
    options: CURRENCY_OPTIONS,
    hint: `${CURRENCIES.join(" · ")}. Puede diferir de la moneda de venta.`,
  },
  {
    key: "kilometers",
    header: "Kilómetros",
    type: "integer",
    example: "45000",
    min: 0,
  },
  {
    key: "fuelType",
    header: "Combustible",
    type: "enum",
    example: "Nafta",
    options: buildOptions(FUEL_TYPE_LABELS),
    hint: labelList(FUEL_TYPE_LABELS),
  },
  {
    key: "transmission",
    header: "Transmisión",
    type: "enum",
    example: "Automática",
    options: buildOptions(TRANSMISSION_TYPE_LABELS),
    hint: labelList(TRANSMISSION_TYPE_LABELS),
  },
  {
    key: "bodyType",
    header: "Carrocería",
    type: "enum",
    example: "Sedán",
    options: buildOptions(VEHICLE_BODY_TYPE_LABELS),
    hint: labelList(VEHICLE_BODY_TYPE_LABELS),
  },
  { key: "color", header: "Color", type: "text", example: "Gris plata", maxLength: 50 },
  { key: "doors", header: "Puertas", type: "integer", example: "5", min: 2, max: 6 },
  { key: "engine", header: "Motor", type: "text", example: "2.0L", maxLength: 50 },
  { key: "vin", header: "VIN", type: "text", example: "8AJBA3CD1P1234567", maxLength: 50 },
  {
    key: "motorNumber",
    header: "Número de motor",
    type: "text",
    example: "2ZR1234567",
    maxLength: 50,
  },
  {
    key: "licensePlate",
    header: "Patente",
    type: "text",
    example: "AF123BC",
    maxLength: 20,
  },
  {
    key: "description",
    header: "Descripción",
    type: "text",
    example: "Único dueño, service oficial al día.",
    maxLength: 2000,
  },
  {
    key: "condition",
    header: "Condición",
    type: "enum",
    example: "Usado",
    options: buildOptions(VEHICLE_CONDITION_LABELS),
    hint: `${labelList(VEHICLE_CONDITION_LABELS)}. Por defecto: Usado.`,
  },
  {
    key: "status",
    header: "Estado",
    type: "enum",
    example: "Disponible",
    options: buildOptions(VEHICLE_STATUS_LABELS),
    hint: `${labelList(VEHICLE_STATUS_LABELS)}. Por defecto: Disponible.`,
  },
  {
    key: "unlimitedStock",
    header: "Stock ilimitado",
    type: "boolean",
    example: "No",
    hint: "Sí / No. Usalo en 0km: el vehículo se puede vender varias veces sin bloquearse.",
  },
];

/** Índice header normalizado -> columna, para resolver los headers del archivo. */
export const COLUMN_BY_NORMALIZED_HEADER: Record<string, ImportColumn> = Object.fromEntries(
  VEHICLE_IMPORT_COLUMNS.map((col) => [normalizeKey(col.header), col])
);
