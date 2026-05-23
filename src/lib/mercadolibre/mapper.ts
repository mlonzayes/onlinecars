/**
 * Mapper: Vehicle (DB) → ML item payload.
 *
 * Categoría vehicular Argentina:
 * - Autos usados:   MLA1744
 * - Autos nuevos:   MLA1743
 * - Pickups/4x4:    MLA3937
 * - Camionetas:     MLA1752
 *
 * Los atributos obligatorios para MLA1744/MLA1743 (Marketplace channel, 2026):
 * BRAND, MODEL, VEHICLE_YEAR, KILOMETERS (solo usados), TRIM,
 * FUEL_TYPE, TRANSMISSION, DOORS, VEHICLE_BODY_TYPE.
 *
 * Atributos renombrados en la API de ML (los viejos no existen más):
 *   YEAR             → VEHICLE_YEAR
 *   CAR_DOORS        → DOORS
 *   VEHICLE_MILEAGE  → KILOMETERS
 *   GEARSHIFT        → TRANSMISSION
 */
import type { Vehicle, VehicleImage, Dealership } from "@prisma/client";
import type { MLCreateItemPayload, MLAttribute, MLLocation } from "./types";

// ─── Mapeos ───────────────────────────────────────────────────────────────────

// Nuestros valores → IDs de atributos ML Argentina
const FUEL_MAP: Record<string, string> = {
  nafta: "Nafta",
  diesel: "Diésel",
  gnc: "GNC",
  electrico: "Eléctrico",
  hibrido: "Híbrido",
};

const TRANSMISSION_MAP: Record<string, string> = {
  manual: "Manual",
  automatica: "Automática",
};

const BODY_TYPE_MAP: Record<string, string> = {
  sedan: "Sedán",
  hatchback: "Hatchback",
  suv: "SUV",
  coupe: "Coupé",
  pickup: "Pick-Up",
  minivan: "Minivan",
  convertible: "Descapotable",
};

const CONDITION_MAP: Record<string, "new" | "used"> = {
  new: "new",
  used: "used",
};

// Categorías por condición y tipo de carrocería
function getCategoryId(vehicle: Vehicle): string {
  if (vehicle.condition === "new") return "MLA1743"; // Autos 0km
  if (vehicle.bodyType === "pickup") return "MLA3937"; // Pickups y 4x4
  return "MLA1744"; // Autos usados (default)
}

// ─── TRIM (versión / línea del modelo) ────────────────────────────────────────

/**
 * ML pide TRIM (ej: "1.6 Comfortline", "GLS", "Active") como obligatorio.
 * Mientras no tengamos un field dedicado en `Vehicle`, lo derivamos del título
 * sacando brand/model/year. Como fallback usamos `engine`, y si todo falla, "Base".
 *
 * TODO: agregar columna `version` a Vehicle + UI para que el usuario lo cargue.
 */
function deriveTrim(vehicle: Vehicle): string {
  const stripped = vehicle.title
    .replace(new RegExp(vehicle.brand, "i"), "")
    .replace(new RegExp(vehicle.model, "i"), "")
    .replace(String(vehicle.year), "")
    .replace(/\s+/g, " ")
    .trim();
  if (stripped) return stripped.slice(0, 60);
  if (vehicle.engine) return vehicle.engine;
  return "Base";
}

// ─── Generador de atributos ───────────────────────────────────────────────────

function buildAttributes(vehicle: Vehicle): MLAttribute[] {
  const attrs: MLAttribute[] = [
    { id: "BRAND", value_name: vehicle.brand },
    { id: "MODEL", value_name: vehicle.model },
    { id: "VEHICLE_YEAR", value_name: String(vehicle.year) },
    { id: "TRIM", value_name: deriveTrim(vehicle) },
  ];

  // Kilometraje — solo para usados, pero ML lo pide siempre como obligatorio en MLA1744.
  if (vehicle.kilometers != null) {
    attrs.push({ id: "KILOMETERS", value_name: String(vehicle.kilometers) });
  }

  if (vehicle.fuelType && FUEL_MAP[vehicle.fuelType]) {
    attrs.push({ id: "FUEL_TYPE", value_name: FUEL_MAP[vehicle.fuelType] });
  }

  if (vehicle.transmission && TRANSMISSION_MAP[vehicle.transmission]) {
    attrs.push({ id: "TRANSMISSION", value_name: TRANSMISSION_MAP[vehicle.transmission] });
  }

  if (vehicle.bodyType && BODY_TYPE_MAP[vehicle.bodyType]) {
    attrs.push({ id: "VEHICLE_BODY_TYPE", value_name: BODY_TYPE_MAP[vehicle.bodyType] });
  }

  if (vehicle.doors != null) {
    attrs.push({ id: "DOORS", value_name: String(vehicle.doors) });
  }

  if (vehicle.color) {
    attrs.push({ id: "COLOR", value_name: vehicle.color });
  }

  if (vehicle.engine) {
    attrs.push({ id: "ENGINE_DISPLACEMENT", value_name: vehicle.engine });
  }

  return attrs;
}

// ─── Título ───────────────────────────────────────────────────────────────────

/**
 * ML limita el título a 60 caracteres.
 * Generamos uno informativo y lo truncamos si es necesario.
 */
function buildTitle(vehicle: Vehicle): string {
  const parts = [vehicle.brand, vehicle.model, String(vehicle.year)];
  if (vehicle.transmission) {
    parts.push(TRANSMISSION_MAP[vehicle.transmission] ?? vehicle.transmission);
  }
  if (vehicle.fuelType && vehicle.fuelType !== "nafta") {
    parts.push(FUEL_MAP[vehicle.fuelType] ?? vehicle.fuelType);
  }

  const title = parts.join(" ");
  return title.length <= 60 ? title : title.slice(0, 57) + "...";
}

// ─── Location ─────────────────────────────────────────────────────────────────

/**
 * ML pide country/state/city. Hardcodeamos Argentina y usamos la dirección del
 * concesionario. Si falta city o province, devolvemos null (el handler valida).
 */
function buildLocation(dealership: Dealership): MLLocation | null {
  if (!dealership.city || !dealership.province) return null;
  return {
    country: { name: "Argentina" },
    state: { name: dealership.province },
    city: { name: dealership.city },
  };
}

// ─── Validación previa ────────────────────────────────────────────────────────

export interface MLPublishValidationError {
  field: string;
  message: string;
}

/**
 * Devuelve los problemas que harían fallar la publicación en ML. Vacío = OK.
 * Llamar ANTES de buildMLPayload para devolver un error claro al usuario en
 * vez de un 422 críptico de ML.
 */
export function validateForMLPublish(
  vehicle: Vehicle,
  dealership: Dealership
): MLPublishValidationError[] {
  const errors: MLPublishValidationError[] = [];

  if (vehicle.kilometers == null) {
    errors.push({ field: "kilometers", message: "El kilometraje es obligatorio para publicar en Mercado Libre." });
  }
  if (vehicle.doors == null) {
    errors.push({ field: "doors", message: "La cantidad de puertas es obligatoria para publicar en Mercado Libre." });
  }
  if (!vehicle.transmission) {
    errors.push({ field: "transmission", message: "La transmisión es obligatoria para publicar en Mercado Libre." });
  }
  if (!vehicle.fuelType) {
    errors.push({ field: "fuelType", message: "El tipo de combustible es obligatorio para publicar en Mercado Libre." });
  }
  if (!vehicle.bodyType) {
    errors.push({ field: "bodyType", message: "El tipo de carrocería es obligatorio para publicar en Mercado Libre." });
  }
  if (!dealership.city || !dealership.province) {
    errors.push({
      field: "dealership.location",
      message: "Tu concesionario necesita tener ciudad y provincia cargadas (Configuración → Datos del concesionario).",
    });
  }

  return errors;
}

// ─── Función principal ────────────────────────────────────────────────────────

export type VehicleWithImages = Vehicle & { images: VehicleImage[] };

export function buildMLPayload(
  vehicle: VehicleWithImages,
  dealership: Dealership,
  listingTypeId: string = "silver"
): MLCreateItemPayload {
  const payload: MLCreateItemPayload = {
    title: buildTitle(vehicle),
    category_id: getCategoryId(vehicle),
    price: Number(vehicle.price),
    currency_id: vehicle.currency as "ARS" | "USD",
    available_quantity: 1, // En clasificados de vehículos siempre es 1
    buying_mode: "classified",
    listing_type_id: listingTypeId,
    condition: CONDITION_MAP[vehicle.condition] ?? "used",
    attributes: buildAttributes(vehicle),
  };

  const location = buildLocation(dealership);
  if (location) payload.location = location;

  // Descripción
  if (vehicle.description) {
    payload.description = { plain_text: vehicle.description };
  }

  // Imágenes — máximo 12 en ML; ordenadas por `order`
  if (vehicle.images.length > 0) {
    const sorted = [...vehicle.images].sort((a, b) => a.order - b.order);
    payload.pictures = sorted.slice(0, 12).map((img) => ({ source: img.url }));
  }

  return payload;
}

/**
 * Preview del título y atributos que se van a enviar, para mostrar en la UI
 * antes de confirmar la publicación.
 */
export function buildMLPreview(vehicle: VehicleWithImages) {
  return {
    title: buildTitle(vehicle),
    category_id: getCategoryId(vehicle),
    attributes: buildAttributes(vehicle),
  };
}
