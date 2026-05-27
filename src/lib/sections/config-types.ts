import type { SectionType } from "../constants";

// Configuración tipada por tipo de sección. Vive en DealershipSection.config (Json).
// El validador correspondiente está en config-schemas.ts.

export interface HeroConfig {
  overlay: number;
  align: "left" | "center";
  showSearch: boolean;
  // Si true, muestra 3 cards al pie del hero (Catálogo / Vender / Contactar).
  // Independiente de showSearch — el dealer puede mostrar ambos, uno o ninguno.
  // Por convención visual: típicamente se muestra UNO de los dos (no ambos).
  showQuickActions: boolean;
}

// Sección de categorías por tipo de carrocería (SUV, Sedán, Hatchback, etc).
// Sin config configurable por ahora — la sección renderiza siempre los 7 bodyTypes.
// La interfaz vacía existe para mantener consistencia con el resto del sistema.
export interface CategoriesConfig {
  // Empty by design. Si en el futuro queremos permitir esconder algunos
  // bodyTypes o cambiar el layout, este es el lugar.
  _reserved?: never;
}

// Sección de marcas oficiales del concesionario. La selección de marcas se hace
// en theme.selectedBrandIds (NO en el config de la sección) — el config queda
// vacío para mantener consistencia y porque la edición de marcas vive en su
// propio panel dentro del editor de la sección.
export interface BrandsConfig {
  _reserved?: never;
}

export interface AboutConfig {
  layout: "text-only" | "image-left" | "image-right";
}

export interface CatalogConfig {
  showFilters: boolean;
  pageSize: number;
  emphasis: "featured" | "recent";
}

export interface GalleryConfig {
  layout: "grid" | "masonry";
  columns: 2 | 3 | 4;
}

export interface FinancingConfig {
  showCalculatorCta: boolean;
}

export interface ReviewsConfig {
  showCta: boolean;
  maxItems: number;
}

export interface ContactConfig {
  showMap: boolean;
  showWhatsapp: boolean;
}

export type SectionConfigByType = {
  hero: HeroConfig;
  categories: CategoriesConfig;
  about: AboutConfig;
  catalog: CatalogConfig;
  brands: BrandsConfig;
  gallery: GalleryConfig;
  financing: FinancingConfig;
  reviews: ReviewsConfig;
  contact: ContactConfig;
};

export type SectionConfigFor<T extends SectionType> = SectionConfigByType[T];
