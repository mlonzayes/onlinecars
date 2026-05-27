export const FUEL_TYPES = ["nafta", "diesel", "gnc", "electrico", "hibrido"] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  nafta: "Nafta",
  diesel: "Diésel",
  gnc: "GNC",
  electrico: "Eléctrico",
  hibrido: "Híbrido",
};

export const TRANSMISSION_TYPES = ["manual", "automatica"] as const;
export type TransmissionType = (typeof TRANSMISSION_TYPES)[number];

export const TRANSMISSION_TYPE_LABELS: Record<TransmissionType, string> = {
  manual: "Manual",
  automatica: "Automática",
};

// Tipos de carrocería — usados para las "categorías" de la home del tenant
// y para filtrar el catálogo. Los íconos se mapean en el componente correspondiente.
export const VEHICLE_BODY_TYPES = [
  "suv",
  "sedan",
  "hatchback",
  "coupe",
  "pickup",
  "minivan",
  "convertible",
] as const;
export type VehicleBodyType = (typeof VEHICLE_BODY_TYPES)[number];

export const VEHICLE_BODY_TYPE_LABELS: Record<VehicleBodyType, string> = {
  suv: "SUV",
  sedan: "Sedán",
  hatchback: "Hatchback",
  coupe: "Coupé",
  pickup: "Pickup",
  minivan: "Minivan",
  convertible: "Convertible",
};

export const VEHICLE_CONDITIONS = ["new", "used"] as const;
export type VehicleCondition = (typeof VEHICLE_CONDITIONS)[number];

export const VEHICLE_CONDITION_LABELS: Record<VehicleCondition, string> = {
  new: "Nuevo",
  used: "Usado",
};

export const VEHICLE_STATUSES = ["available", "reserved", "sold"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  available: "Disponible",
  reserved: "Reservado",
  sold: "Vendido",
};

export const LEAD_STATUSES = ["new", "contacted", "qualified", "closed"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = ["web", "whatsapp", "mercadolibre", "tasacion"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const CURRENCIES = ["ARS", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const USER_ROLES = ["admin", "editor", "viewer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PROVINCIAS_ARGENTINA = [
  "Buenos Aires",
  "CABA",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

export const MAX_IMAGES_PER_VEHICLE = 15;
export const VEHICLES_PER_PAGE = 12;
export const CACHE_TTL_VEHICLES = 300; // 5 minutos
export const CACHE_TTL_DEALERSHIP = 300; // 5 minutos

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

// --- Customers ---
export const CUSTOMER_TYPES = ["individual", "company"] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

// Labels para mostrar en la UI. Los values internos quedan en inglés porque
// es lo que vive en la DB; estas labels son SOLO para display.
export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  individual: "Particular",
  company: "Empresa",
};

export const CUSTOMER_DOCUMENT_TYPES = ["DNI", "CUIT", "CUIL", "PASAPORTE"] as const;
export type CustomerDocumentType = (typeof CUSTOMER_DOCUMENT_TYPES)[number];

// --- Sales (Phase 2) ---
export const SALE_STATUSES = [
  "draft",
  "reserved",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type SaleStatus = (typeof SALE_STATUSES)[number];

// --- Sale Documents (Phase 3) ---
// Categorías para agrupar el legajo en la UI. El "type" del documento es texto
// libre (ej: "DNI Frente", "Título", "Boleto") — se cerrará cuando estabilicemos el set.
export const SALE_DOCUMENT_CATEGORIES = ["customer", "vehicle", "operation"] as const;
export type SaleDocumentCategory = (typeof SALE_DOCUMENT_CATEGORIES)[number];

export const SALE_DOCUMENT_CATEGORY_LABELS: Record<SaleDocumentCategory, string> = {
  customer: "Cliente",
  vehicle: "Vehículo",
  operation: "Operación",
};

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export type AllowedDocumentType = (typeof ALLOWED_DOCUMENT_TYPES)[number];

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_DOCUMENTS_PER_SALE = 50;

// Umbrales legales — actualizar según normativa UIF/AFIP vigente.
// Vienen como any para evitar pérdidas de precisión con valores grandes; usar BigInt o Decimal en runtime.
export const SALE_LEGAL_THRESHOLDS = {
  // Sobre este monto en ARS se requiere DDJJ de origen de fondos (UIF).
  UIF_DDJJ_ARS: 92_000_000,
  // Sobre este monto se requiere certificado CETA (AFIP).
  CETA_ARS: 100_000_000,
} as const;

// --- Tenant site builder ---
export const SECTION_TYPES = [
  "hero",
  "categories",
  "about",
  "catalog",
  "brands",
  "gallery",
  "financing",
  "reviews",
  "contact",
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  hero: "Portada",
  categories: "Categorías",
  about: "Sobre nosotros",
  catalog: "Catálogo",
  brands: "Marcas",
  gallery: "Galería",
  financing: "Financiación",
  reviews: "Opiniones",
  contact: "Contacto",
};

export const MEDIA_PURPOSES = [
  "hero_image",
  "hero_video",
  "about_image",
  "section_image",
  "gallery_image",
] as const;
export type MediaPurpose = (typeof MEDIA_PURPOSES)[number];

export const SINGLETON_MEDIA_PURPOSES = [
  "hero_image",
  "hero_video",
  "about_image",
  "section_image",
] as const satisfies readonly MediaPurpose[];

export type SingletonMediaPurpose = (typeof SINGLETON_MEDIA_PURPOSES)[number];

export const MAX_GALLERY_IMAGES = 20;
export const MAX_TENANT_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_HERO_VIDEO_BYTES = 20 * 1024 * 1024; // 20MB

export const ALLOWED_TENANT_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export type AllowedTenantImageMimeType = (typeof ALLOWED_TENANT_IMAGE_MIME_TYPES)[number];

export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
] as const;
export type AllowedVideoMimeType = (typeof ALLOWED_VIDEO_MIME_TYPES)[number];

export const SECTION_TEXT_LIMITS = {
  titleMin: 1,
  titleMax: 80,
  subtitleMax: 200,
  contentMax: 2000,
} as const;

// --- Quotations ---
export const QUOTATION_TYPES = ["sale", "purchase"] as const;
export type QuotationType = (typeof QUOTATION_TYPES)[number];

export const QUOTATION_STATUSES = ["pending", "accepted", "rejected", "expired"] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export const QUOTATION_PAYMENT_METHODS = ["cash", "financed", "mixed"] as const;
export type QuotationPaymentMethod = (typeof QUOTATION_PAYMENT_METHODS)[number];

export const DEALERSHIP_PLANS = ["base", "media", "premium", "enterprise"] as const;
export type DealershipPlan = (typeof DEALERSHIP_PLANS)[number];

export const DEFAULT_QUOTATION_VALIDITY_DAYS = 15;
