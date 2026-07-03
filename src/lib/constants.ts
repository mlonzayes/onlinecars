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

// Monedas soportadas. ARS/USD son las históricas; el resto se sumaron al
// habilitar países hispanohablantes (ver COUNTRIES). USD se mantiene como moneda
// "dura" para precios de vehículos en cualquier país. Ampliar es backward-compatible:
// los validadores que usan z.enum(CURRENCIES) aceptan más valores, nunca menos.
export const CURRENCIES = ["ARS", "USD", "MXN", "CLP", "COP", "UYU", "EUR"] as const;
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

// Techo absoluto del producto. El gating real por plan vive en plans.ts
// (maxImagesPerVehicle). Este es un sanity cap para evitar abuso de storage
// — ningún plan puede pasar de acá ni con Premium/Enterprise.
export const MAX_IMAGES_PER_VEHICLE = 40;
export const VEHICLES_PER_PAGE = 12;

// Umbrales de "aging" del stock (días en inventario) para alertar autos clavados
// en el listado del dashboard. watch = empieza a demorar, stale = revisar precio.
export const STOCK_AGING_WATCH_DAYS = 60;
export const STOCK_AGING_STALE_DAYS = 90;
export const CACHE_TTL_VEHICLES = 300; // 5 minutos
export const CACHE_TTL_DEALERSHIP = 300; // 5 minutos

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

// --- Vehicle expenses (gastos de reacondicionamiento) ---
export const VEHICLE_EXPENSE_CATEGORIES = [
  "pulido",
  "mecanica",
  "transferencia",
  "gestoria",
  "flete",
  "repuestos",
  "otros",
] as const;
export type VehicleExpenseCategory = (typeof VEHICLE_EXPENSE_CATEGORIES)[number];

export const VEHICLE_EXPENSE_CATEGORY_LABELS: Record<VehicleExpenseCategory, string> = {
  pulido: "Pulido / detailing",
  mecanica: "Mecánica",
  transferencia: "Transferencia",
  gestoria: "Gestoría",
  flete: "Flete / logística",
  repuestos: "Repuestos",
  otros: "Otros",
};

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

// --- Redes sociales del tenant ---
// Las keys son los identificadores internos (coinciden con SocialLinks en
// src/types). WhatsApp NO está acá — se renderiza desde el campo `whatsapp`
// del Dealership. El orden define cómo se muestran los íconos en el sitio.
export const SOCIAL_NETWORKS = [
  "instagram",
  "facebook",
  "tiktok",
  "x",
  "threads",
] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

// Label + prefijo base de cada red. El prefijo se usa para reconstruir la URL
// cuando el dealer carga solo el usuario/handle (ej: "miconcesionaria" →
// https://instagram.com/miconcesionaria). Si ya pega una URL completa, se respeta.
export const SOCIAL_NETWORK_META: Record<
  SocialNetwork,
  { label: string; baseUrl: string; placeholder: string }
> = {
  instagram: {
    label: "Instagram",
    baseUrl: "https://instagram.com/",
    placeholder: "usuario o link de tu perfil",
  },
  facebook: {
    label: "Facebook",
    baseUrl: "https://facebook.com/",
    placeholder: "usuario o link de tu página",
  },
  tiktok: {
    label: "TikTok",
    baseUrl: "https://tiktok.com/@",
    placeholder: "usuario o link de tu perfil",
  },
  x: {
    label: "X",
    baseUrl: "https://x.com/",
    placeholder: "usuario o link de tu perfil",
  },
  threads: {
    label: "Threads",
    baseUrl: "https://threads.net/@",
    placeholder: "usuario o link de tu perfil",
  },
};

// --- Internacionalización (i18n) ---
// Primera fase: mercados hispanohablantes. El `country` del Dealership es el
// cimiento del que se derivan moneda, locale, timezone y (más adelante) qué set
// de documentos de identidad y divisiones territoriales se habilita por país.
export const COUNTRIES = ["AR", "MX", "CL", "CO", "UY", "ES"] as const;
export type Country = (typeof COUNTRIES)[number];

export const COUNTRY_LABELS: Record<Country, string> = {
  AR: "Argentina",
  MX: "México",
  CL: "Chile",
  CO: "Colombia",
  UY: "Uruguay",
  ES: "España",
};

// Locales soportados. Por ahora TODOS son español: el idioma no cambia entre
// estos países, pero el formateo regional (separadores de miles, formato de
// fecha, símbolo y posición de la moneda) sí difiere. Cuando entren pt/en se
// suman acá (ej: "pt-BR", "en-US").
export const LOCALES = ["es-AR", "es-MX", "es-CL", "es-CO", "es-UY", "es-ES"] as const;
export type Locale = (typeof LOCALES)[number];

// Defaults por país. Se aplican en el onboarding cuando el dealer elige su país;
// quedan editables después desde Configuración. `siteLocale` arranca igual al
// `locale` del panel — el dealer puede divergirlos (ej: panel en es, vidriera en
// en para un mercado turístico) una vez que el i18n de la vidriera esté activo.
export const COUNTRY_DEFAULTS: Record<
  Country,
  { currency: Currency; locale: Locale; timezone: string }
> = {
  AR: { currency: "ARS", locale: "es-AR", timezone: "America/Argentina/Buenos_Aires" },
  MX: { currency: "MXN", locale: "es-MX", timezone: "America/Mexico_City" },
  CL: { currency: "CLP", locale: "es-CL", timezone: "America/Santiago" },
  CO: { currency: "COP", locale: "es-CO", timezone: "America/Bogota" },
  UY: { currency: "UYU", locale: "es-UY", timezone: "America/Montevideo" },
  ES: { currency: "EUR", locale: "es-ES", timezone: "Europe/Madrid" },
};
