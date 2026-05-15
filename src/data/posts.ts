export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: "ventas" | "marketing" | "stock" | "operativa" | "tendencias";
  /** Fecha en formato ISO (YYYY-MM-DD) */
  publishedAt: string;
  readingMinutes: number;
  /** Iniciales del autor para el avatar (sin sistema real de avatares todavía) */
  authorInitials: string;
  authorName: string;
  /** Ruta a la imagen de cover (ej: "/blog/aumentar-consultas.jpg").
   *  Si no se pasa, se renderiza un gradient placeholder con la categoría. */
  coverImage?: string;
}

// Posts mock — el contenido individual no existe todavía. Cuando agreguemos
// MDX o un CMS, cada post tendrá su /blog/[slug] con el body completo.
export const POSTS: BlogPost[] = [
  {
    slug: "aumentar-consultas-concesionario",
    title: "Cómo aumentar las consultas a tu concesionario en 30 días",
    excerpt:
      "Tres palancas concretas que mueven la aguja: SEO local, fotos profesionales y respuesta rápida. Sin pagar publicidad.",
    category: "marketing",
    publishedAt: "2026-05-08",
    readingMinutes: 6,
    authorInitials: "ML",
    authorName: "Mateo Lonzayes",
  },
  {
    slug: "por-que-no-alcanza-mercadolibre",
    title: "Por qué no alcanza con MercadoLibre para vender autos",
    excerpt:
      "Las comisiones, la dependencia de la plataforma y la pérdida de datos del cliente son razones para tener un sitio propio. Te lo desglosamos.",
    category: "ventas",
    publishedAt: "2026-05-02",
    readingMinutes: 8,
    authorInitials: "MW",
    authorName: "MW Studio Digital",
  },
  {
    slug: "guia-fotografiar-autos",
    title: "Guía rápida para fotografiar autos del concesionario",
    excerpt:
      "Ángulos, iluminación y postproducción básica para que tus publicaciones generen el doble de consultas. No necesitás cámara profesional.",
    category: "operativa",
    publishedAt: "2026-04-25",
    readingMinutes: 5,
    authorInitials: "ML",
    authorName: "Mateo Lonzayes",
  },
  {
    slug: "errores-cargar-stock-online",
    title: "5 errores comunes al cargar stock online",
    excerpt:
      "Datos legales incompletos, fotos mal recortadas, precios sin moneda. Cada error te cuesta consultas. Cómo detectarlos y corregirlos.",
    category: "stock",
    publishedAt: "2026-04-18",
    readingMinutes: 4,
    authorInitials: "MW",
    authorName: "MW Studio Digital",
  },
  {
    slug: "tendencias-2026-compradores",
    title: "Tendencias 2026: qué esperan los compradores de autos",
    excerpt:
      "Financiación digital, transparencia de precios y experiencia mobile-first. Lo que cambió en el último año y cómo adaptarte.",
    category: "tendencias",
    publishedAt: "2026-04-10",
    readingMinutes: 7,
    authorInitials: "ML",
    authorName: "Mateo Lonzayes",
  },
  {
    slug: "calcular-precio-justo-usado",
    title: "Cómo calcular el precio justo de un usado",
    excerpt:
      "Fuentes de mercado, factores que ajustan el valor (estado, kilometraje, demanda regional) y un método práctico para evitar tasaciones erradas.",
    category: "operativa",
    publishedAt: "2026-04-03",
    readingMinutes: 6,
    authorInitials: "MW",
    authorName: "MW Studio Digital",
  },
];

const CATEGORY_LABELS: Record<BlogPost["category"], string> = {
  ventas: "Ventas",
  marketing: "Marketing",
  stock: "Stock",
  operativa: "Operativa",
  tendencias: "Tendencias",
};

export function categoryLabel(category: BlogPost["category"]): string {
  return CATEGORY_LABELS[category];
}

/** Devuelve los N posts más recientes ordenados por fecha descendente. */
export function getRecentPosts(limit: number): BlogPost[] {
  return [...POSTS]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}

/** Devuelve todos los posts ordenados por fecha descendente. */
export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
