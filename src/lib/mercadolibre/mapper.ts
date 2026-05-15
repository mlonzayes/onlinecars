/**
 * Mapper: Vehicle (DB) → ML item payload.
 *
 * Categoría vehicular Argentina:
 * - Autos usados:   MLA1744
 * - Autos nuevos:   MLA1743
 * - Pickups/4x4:    MLA3937
 * - Camionetas:     MLA1752
 *
 * Esta categorización simple cubre el 90% de los casos.
 * Para casos especiales (motos, camiones) se puede extender.
 *
 * Los atributos obligatorios para MLA1744/MLA1743:
 * BRAND, MODEL, YEAR, VEHICLE_MILEAGE (solo usados),
 * FUEL_TYPE, GEARSHIFT, CAR_DOORS, VEHICLE_BODY_TYPE
 */
import type { Vehicle, VehicleImage } from "@prisma/client";
import type { MLCreateItemPayload, MLAttribute } from "./types";

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

// ─── Generador de atributos ───────────────────────────────────────────────────

function buildAttributes(vehicle: Vehicle): MLAttribute[] {
  const attrs: MLAttribute[] = [
    { id: "BRAND", value_name: vehicle.brand },
    { id: "MODEL", value_name: vehicle.model },
    { id: "YEAR", value_name: String(vehicle.year) },
  ];

  // Kilometraje — solo para usados
  if (vehicle.condition === "used" && vehicle.kilometers != null) {
    attrs.push({ id: "VEHICLE_MILEAGE", value_name: String(vehicle.kilometers) });
  }

  if (vehicle.fuelType && FUEL_MAP[vehicle.fuelType]) {
    attrs.push({ id: "FUEL_TYPE", value_name: FUEL_MAP[vehicle.fuelType] });
  }

  if (vehicle.transmission && TRANSMISSION_MAP[vehicle.transmission]) {
    attrs.push({ id: "GEARSHIFT", value_name: TRANSMISSION_MAP[vehicle.transmission] });
  }

  if (vehicle.bodyType && BODY_TYPE_MAP[vehicle.bodyType]) {
    attrs.push({ id: "VEHICLE_BODY_TYPE", value_name: BODY_TYPE_MAP[vehicle.bodyType] });
  }

  if (vehicle.doors != null) {
    attrs.push({ id: "CAR_DOORS", value_name: String(vehicle.doors) });
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
  // ML rechaza títulos > 60 chars en la vertical de vehículos
  return title.length <= 60 ? title : title.slice(0, 57) + "...";
}

// ─── Función principal ────────────────────────────────────────────────────────

export type VehicleWithImages = Vehicle & { images: VehicleImage[] };

export function buildMLPayload(
  vehicle: VehicleWithImages,
  listingTypeId: string = "silver"
): MLCreateItemPayload {
  const payload: MLCreateItemPayload = {
    title: buildTitle(vehicle),
    category_id: getCategoryId(vehicle),
    price: Number(vehicle.price),
    currency_id: vehicle.currency as "ARS" | "USD",
    buying_mode: "classified",
    listing_type_id: listingTypeId,
    condition: CONDITION_MAP[vehicle.condition] ?? "used",
    attributes: buildAttributes(vehicle),
  };

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
