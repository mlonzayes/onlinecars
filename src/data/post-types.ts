export interface PostFaq {
  question: string;
  /** 1 a 3 frases. Va también al JSON-LD FAQPage de la nota. */
  answer: string;
}

export interface PostSource {
  /** Nombre de la fuente tal como se muestra ("BCRA, cotización oficial"). */
  label: string;
  /** URL absoluta. Solo fuentes que se consultaron de verdad. */
  url: string;
}

export const POST_CATEGORIES = ["ventas", "marketing", "stock", "operativa", "tendencias"] as const;
export type PostCategory = (typeof POST_CATEGORIES)[number];

export const POST_CATEGORY_LABELS: Record<PostCategory, string> = {
  ventas: "Ventas",
  marketing: "Marketing",
  stock: "Stock",
  operativa: "Operativa",
  tendencias: "Tendencias",
};

export function categoryLabel(category: PostCategory): string {
  return POST_CATEGORY_LABELS[category];
}

export const POST_AUTHOR_TYPES = ["Person", "Organization"] as const;
export type PostAuthorType = (typeof POST_AUTHOR_TYPES)[number];

// "published" con fecha futura = programada (ver BlogPost.publishedAt en el schema).
export const POST_STATUSES = ["draft", "published"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: PostCategory;
  /** Fecha en formato ISO (YYYY-MM-DD) */
  publishedAt: string;
  /**
   * Última revisión de contenido (YYYY-MM-DD). Alimenta `dateModified`, el
   * sitemap y el "Actualizado" de la nota. Cambiarla SOLO si el contenido
   * cambió: una fecha nueva sobre el mismo texto es una mentira que los
   * buscadores terminan detectando.
   */
  updatedAt?: string;
  /** Iniciales del autor para el avatar (sin sistema real de avatares todavía) */
  authorInitials: string;
  authorName: string;
  /** "Organization" para notas firmadas por un estudio/empresa. Default: Person. */
  authorType?: PostAuthorType;
  authorUrl?: string;
  /** Ruta a la imagen de cover (ej: "/blog/aumentar-consultas.jpg").
   *  Si no se pasa, se renderiza un gradient placeholder con la categoría. */
  coverImage?: string;
  /**
   * Resumen de 2 a 4 frases que responde la pregunta de la nota. Es el bloque
   * que más chances tiene de citar un motor de IA: tiene que poder leerse solo,
   * sin el resto del artículo. Solo hechos que ya están en el cuerpo.
   */
  tldr?: string[];
  /**
   * Cuerpo en Markdown simple (ver lib/blog-markdown.ts): ## y ### subtítulos,
   * párrafos separados por línea en blanco, listas con - o 1., links con
   * [texto](/ruta) y **negrita**.
   */
  body: string;
  faqs?: PostFaq[];
  sources?: PostSource[];
}
