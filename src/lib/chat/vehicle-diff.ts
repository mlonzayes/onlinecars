import {
  FUEL_TYPE_LABELS,
  TRANSMISSION_TYPE_LABELS,
  VEHICLE_BODY_TYPE_LABELS,
  VEHICLE_CONDITION_LABELS,
} from "@/lib/constants";

// "Antes → después" de un update de vehículo, para la tarjeta de confirmación
// del chat. Una línea por campo que cambia.

const FIELD_LABELS: Record<string, string> = {
  title: "Título",
  brand: "Marca",
  model: "Modelo",
  year: "Año",
  price: "Precio",
  currency: "Moneda",
  costPrice: "Precio de compra",
  costCurrency: "Moneda de compra",
  kilometers: "Kilómetros",
  fuelType: "Combustible",
  transmission: "Transmisión",
  bodyType: "Carrocería",
  color: "Color",
  doors: "Puertas",
  engine: "Motor",
  vin: "VIN",
  motorNumber: "N° de motor",
  licensePlate: "Patente",
  condition: "Condición",
  description: "Descripción",
};

const VALUE_LABELS: Record<string, Record<string, string>> = {
  fuelType: FUEL_TYPE_LABELS,
  transmission: TRANSMISSION_TYPE_LABELS,
  bodyType: VEHICLE_BODY_TYPE_LABELS,
  condition: VEHICLE_CONDITION_LABELS,
};

const COST_FIELDS = new Set(["costPrice", "costCurrency"]);
const NUMERIC_FIELDS = new Set(["price", "costPrice", "kilometers"]);

// La descripción nueva se muestra entera hasta este largo: es texto PÚBLICO y
// es donde una prompt injection metería un teléfono o un link.
const MAX_DESCRIPTION_PREVIEW = 500;

function show(field: string, value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  const text = String(value);
  if (NUMERIC_FIELDS.has(field) && Number.isFinite(Number(text))) return Number(text).toLocaleString("es-AR");
  return VALUE_LABELS[field]?.[text] ?? text;
}

export function describeVehicleChanges(
  current: Record<string, unknown>,
  changes: Record<string, unknown>,
  canEditCosts: boolean
): string[] {
  const lines: string[] = [];
  for (const [field, next] of Object.entries(changes)) {
    // El servicio descarta los costos si el rol no puede editarlos: no mostrarlos.
    if (COST_FIELDS.has(field) && !canEditCosts) continue;
    if (show(field, current[field]) === show(field, next)) continue;

    const label = FIELD_LABELS[field] ?? field;
    if (field === "description") {
      const text = String(next ?? "");
      const preview = text.length > MAX_DESCRIPTION_PREVIEW ? `${text.slice(0, MAX_DESCRIPTION_PREVIEW)}…` : text;
      lines.push(`${label} nueva: "${preview}"`);
      continue;
    }
    lines.push(`${label}: ${show(field, current[field])} → ${show(field, next)}`);
  }
  return lines;
}
