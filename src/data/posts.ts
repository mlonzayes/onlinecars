export interface ArticleSection {
  heading: string;
  /** Párrafos del bloque. */
  body: string[];
}

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
  /** Cuerpo del artículo, en secciones. Se renderiza en /blog/[slug]. */
  content: ArticleSection[];
}

// Posts mock. El contenido es real (sirve para SEO + lectura); cuando migremos a
// MDX o un CMS, cada post tendrá su body editable desde ahí.
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
    coverImage: "/premium_images/P7_blog_consultas.png",
    content: [
      {
        heading: "Aparecé cuando te buscan: SEO local",
        body: [
          "La mayoría de las búsquedas de autos arrancan en Google con intención local: \"concesionaria usados en tu ciudad\". Si tu negocio no tiene presencia web propia, esas búsquedas se las llevan los portales y la competencia — el problema que desarrollamos en [por qué no alcanza con MercadoLibre para vender autos](/blog/por-que-no-alcanza-mercadolibre).",
          "Tener un sitio con tu marca, tu localidad y tu catálogo indexable hace que aparezcas en esos resultados. Es tráfico que no pagás: llega solo, todos los días.",
        ],
      },
      {
        heading: "Las fotos venden antes que el precio",
        body: [
          "Vender autos online es, en buena medida, vender fotos. Una publicación con imágenes claras, bien iluminadas y desde varios ángulos genera el doble de consultas que una con fotos oscuras o de celular apuradas.",
          "No necesitás equipo profesional: luz natural, fondo limpio y consistencia entre vehículos alcanzan para diferenciarte de la mayoría. Lo desglosamos paso a paso en la [guía rápida para fotografiar autos del concesionario](/blog/guia-fotografiar-autos).",
        ],
      },
      {
        heading: "Respondé rápido o lo perdés",
        body: [
          "La velocidad de respuesta es el factor más subestimado. Un lead contestado en los primeros minutos tiene muchísima más chance de convertir que uno respondido al otro día.",
          "Centralizar las consultas en un solo lugar —en vez de tenerlas desparramadas entre WhatsApp, mail y portales— te permite no perder ninguna y hacer seguimiento real. El panel de leads viene incluido en [todos los planes de motorflow](/precios).",
        ],
      },
    ],
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
    coverImage: "/premium_images/P8_blog_mercadolibre.png",
    content: [
      {
        heading: "Las comisiones se comen tu margen",
        body: [
          "Publicar en portales tiene un costo que crece con tu volumen. Cada operación que cerrás pagando comisión es margen que dejás en la mesa de otro.",
          "Un sitio propio con suscripción fija invierte la ecuación: cuanto más vendés, más conviene, porque el costo no escala con las ventas. Hacé la cuenta contra lo que pagás hoy de comisión mirando [los planes y precios de motorflow](/precios).",
        ],
      },
      {
        heading: "Dependés de reglas que no controlás",
        body: [
          "Los portales cambian tarifas, posicionamiento y reglas cuando quieren. Tu negocio queda a merced de decisiones ajenas, sin alternativa propia a la cual recurrir.",
          "Tener tu canal directo no significa abandonar los portales: significa no depender exclusivamente de ellos.",
        ],
      },
      {
        heading: "Los datos del cliente son tuyos",
        body: [
          "Cuando una consulta entra por un portal, el vínculo con ese cliente es del portal, no tuyo. Perdés la posibilidad de hacer seguimiento, fidelizar y volver a venderle.",
          "Con sitio propio, cada lead y cada cliente quedan en tu base. Eso es un activo que se acumula con el tiempo y que ningún portal te puede quitar, y es la materia prima para las palancas que explicamos en [cómo aumentar las consultas a tu concesionario en 30 días](/blog/aumentar-consultas-concesionario).",
        ],
      },
    ],
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
    coverImage: "/premium_images/P9_blog_fotografia.png",
    content: [
      {
        heading: "La luz lo es casi todo",
        body: [
          "Fotografiá con luz natural difusa: temprano a la mañana o al atardecer evitás los reflejos duros del sol del mediodía sobre la chapa. Las fotos son una de las tres palancas de [cómo aumentar las consultas a tu concesionario en 30 días](/blog/aumentar-consultas-concesionario).",
          "Evitá el contraluz y los fondos cargados. Una pared lisa o un espacio abierto y ordenado hacen que el auto sea el protagonista.",
        ],
      },
      {
        heading: "Los ángulos que no pueden faltar",
        body: [
          "Mínimo: 3/4 frontal (la foto principal), lateral, 3/4 trasero, interior desde el asiento del conductor, tablero y baúl.",
          "Sumá detalles que generan confianza: tapizado, llantas, motor. La transparencia reduce las consultas de \"¿está bien?\" y atrae compradores más decididos.",
        ],
      },
      {
        heading: "Postproducción mínima y consistente",
        body: [
          "Un encuadre parejo, recorte uniforme y un leve ajuste de brillo y contraste alcanzan. No exageres la edición: una foto demasiado retocada genera desconfianza.",
          "Lo más importante es la consistencia: que todos tus vehículos sigan el mismo estilo. Eso transmite profesionalismo a primera vista. Las fotos flojas son, de hecho, uno de [los 5 errores más comunes al cargar stock online](/blog/errores-cargar-stock-online).",
        ],
      },
    ],
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
    content: [
      {
        heading: "1. Datos incompletos o inconsistentes",
        body: [
          "Año, kilometraje, tipo de combustible y transmisión cargados a medias hacen que el comprador desconfíe o ni siquiera te encuentre en los filtros. Completá todos los campos, siempre.",
        ],
      },
      {
        heading: "2. Precios sin moneda o desactualizados",
        body: [
          "Un precio sin aclarar si es en pesos o dólares genera consultas que no convierten. Y un precio viejo te hace perder credibilidad. Revisá y actualizá con frecuencia, y si dudás del número mirá [cómo calcular el precio justo de un usado](/blog/calcular-precio-justo-usado).",
        ],
      },
      {
        heading: "3. Fotos pocas o de mala calidad",
        body: [
          "Una sola foto, oscura o mal recortada, mata la publicación. El stock online se vende con imágenes: invertí esos minutos por vehículo siguiendo la [guía rápida para fotografiar autos del concesionario](/blog/guia-fotografiar-autos).",
        ],
      },
      {
        heading: "4. Descripciones vacías",
        body: [
          "Dejar la descripción en blanco o copiar la misma para todos los autos desperdicia una oportunidad de posicionar y de responder dudas antes de que las pregunten.",
        ],
      },
      {
        heading: "5. No despublicar lo vendido",
        body: [
          "Mantener publicado un auto ya vendido genera consultas inútiles y frustra al comprador. Mantené tu catálogo al día: refleja seriedad.",
        ],
      },
    ],
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
    content: [
      {
        heading: "Todo empieza en el celular",
        body: [
          "La gran mayoría de la búsqueda de un auto hoy se hace desde el teléfono. Si tu sitio no carga rápido y no se ve bien en mobile, perdés al comprador antes de que vea el precio.",
          "Mobile-first no es opcional: es el punto de partida del diseño de cualquier catálogo online. Todos [los sitios que armamos con motorflow](/precios) salen así por default.",
        ],
      },
      {
        heading: "Transparencia de precios",
        body: [
          "El comprador 2026 desconfía del \"consultar precio\". Mostrar el precio claro, con la moneda y las condiciones, genera más confianza y filtra consultas serias. Para llegar a ese número con criterio, mirá [cómo calcular el precio justo de un usado](/blog/calcular-precio-justo-usado).",
        ],
      },
      {
        heading: "Financiación clara desde el primer contacto",
        body: [
          "Poder mostrar opciones de financiación o cotizar una operación rápido acorta el camino a la venta. El que da certezas antes, gana.",
        ],
      },
    ],
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
    content: [
      {
        heading: "Partí del valor de mercado",
        body: [
          "Cruzá varias fuentes: guías de precios, publicaciones activas del mismo modelo/año/versión y operaciones reales recientes. El precio de lista de la competencia es referencia, no verdad absoluta.",
        ],
      },
      {
        heading: "Ajustá por los factores que importan",
        body: [
          "Estado general, kilometraje, historial de service, originalidad y demanda regional mueven el valor para arriba o para abajo. Un mismo modelo no vale lo mismo en dos ciudades distintas.",
        ],
      },
      {
        heading: "Un método simple y repetible",
        body: [
          "Tomá el valor de mercado base, aplicá los ajustes por estado y kilometraje, y contrastá contra tu margen objetivo. Documentá el criterio: así tasás parejo y no a ojo.",
          "Una vez definido el precio, cargalo bien: publicarlo sin moneda o desactualizado es uno de [los 5 errores más comunes al cargar stock online](/blog/errores-cargar-stock-online).",
        ],
      },
    ],
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

/** Resuelve un post por su slug (para /blog/[slug]). */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}
