import type { SectionType } from "./constants";
import type { SectionConfigByType } from "./sections/config-types";

// Defaults aplicados al crear un Dealership (onboarding) o al "resetear" una sección.
// Mantener acá la fuente de verdad — los handlers leen de acá para sembrar registros.

export interface SectionDefaultCopy {
  title: string;
  subtitle: string | null;
  content: string | null;
}

export const DEFAULT_SECTION_ORDER: Record<SectionType, number> = {
  hero: 1,
  categories: 2,
  catalog: 3,
  brands: 4,
  gallery: 5,
  about: 6,
  financing: 7,
  reviews: 8,
  contact: 9,
};

export const DEFAULT_SECTION_COPY: Record<SectionType, SectionDefaultCopy> = {
  hero: {
    title: "Encontrá tu próximo auto",
    subtitle: "Buscá en nuestro stock por marca, condición o presupuesto.",
    content: null,
  },
  categories: {
    title: "Categorías",
    subtitle: "Filtrá rápido por el tipo de vehículo que buscás.",
    content: null,
  },
  about: {
    title: "Sobre nosotros",
    subtitle: null,
    content: "Contanos un poco sobre el concesionario, su historia y lo que los hace únicos.",
  },
  catalog: {
    title: "Nuestros vehículos",
    subtitle: "Una selección curada de la mejor parte de nuestro inventario.",
    content: null,
  },
  brands: {
    title: "Marcas premium",
    subtitle: "Acceso directo a las marcas más buscadas del mercado.",
    content: null,
  },
  gallery: {
    title: "Nuestras instalaciones",
    subtitle: "Conocé el lugar donde te esperamos.",
    content: null,
  },
  financing: {
    title: "Financiación a tu medida",
    subtitle: "Planes que se adaptan a tu presupuesto.",
    content: null,
  },
  reviews: {
    title: "Lo que dicen nuestros clientes",
    subtitle: "Opiniones reales de quienes ya confiaron en nosotros.",
    content: null,
  },
  contact: {
    title: "¿Tenés alguna consulta?",
    subtitle: "Estamos para ayudarte.",
    content: "Escribinos y te respondemos a la brevedad.",
  },
};

export const DEFAULT_SECTION_CONFIG: SectionConfigByType = {
  hero: { overlay: 70, align: "center", showSearch: true, showQuickActions: false },
  categories: {},
  about: { layout: "image-right" },
  catalog: { showFilters: true, pageSize: 12, emphasis: "featured" },
  brands: {},
  gallery: { layout: "grid", columns: 3 },
  financing: { showCalculatorCta: true },
  reviews: { showCta: true, maxItems: 6 },
  contact: { showMap: false, showWhatsapp: true },
};
