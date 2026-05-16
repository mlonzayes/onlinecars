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
  catalog: 2,
  gallery: 3,
  about: 4,
  financing: 5,
  reviews: 6,
  contact: 7,
};

export const DEFAULT_SECTION_COPY: Record<SectionType, SectionDefaultCopy> = {
  hero: {
    title: "Encontrá tu próximo auto",
    subtitle: "Buscá en nuestro stock por marca, condición o presupuesto.",
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
  hero: { overlay: 70, align: "center", showSearch: true },
  about: { layout: "image-right" },
  catalog: { showFilters: true, pageSize: 12, emphasis: "featured" },
  gallery: { layout: "grid", columns: 3 },
  financing: { showCalculatorCta: true },
  reviews: { showCta: true, maxItems: 6 },
  contact: { showMap: false, showWhatsapp: true },
};
