import type { SectionType } from "../constants";

// Configuración tipada por tipo de sección. Vive en DealershipSection.config (Json).
// El validador correspondiente está en config-schemas.ts.

export interface HeroConfig {
  overlay: number;
  align: "left" | "center";
  showSearch: boolean;
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
  about: AboutConfig;
  catalog: CatalogConfig;
  gallery: GalleryConfig;
  financing: FinancingConfig;
  reviews: ReviewsConfig;
  contact: ContactConfig;
};

export type SectionConfigFor<T extends SectionType> = SectionConfigByType[T];
