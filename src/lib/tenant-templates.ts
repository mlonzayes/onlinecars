import { DM_Sans, Poppins, Space_Grotesk, Unbounded } from "next/font/google";
import type { SectionType } from "./constants";

/**
 * Sistema de plantillas del sitio público del tenant.
 *
 * Cada plantilla define:
 *  - Un conjunto de CSS variables (colores, surfaces, bordes, radius) que
 *    los componentes del tenant consumen vía `bg-[var(--tenant-bg)]`, etc.
 *  - Una fuente cargada con next/font (auto-tree-shake: si nadie la usa,
 *    no llega al bundle).
 *  - Opcionalmente un `layout` fijo: la lista exacta de bloques del home, en
 *    orden. Ver "Plantillas con layout fijo" más abajo.
 *
 * Para sumar una plantilla nueva:
 *  1. Agregar la entrada a TENANT_TEMPLATES (id + name + description + font + tokens)
 *  2. Ya está — el layout aplica los tokens automáticamente y el validator
 *     deriva el enum de acá (ver TENANT_TEMPLATE_ID_TUPLE).
 *
 * Nota sobre fuentes: next/font NO soporta selección dinámica. Tenemos que
 * declarar TODAS las fuentes al top-level del módulo. El bundler solo incluye
 * las que efectivamente se referencian al runtime — pero declararlas todas
 * acá no aumenta el bundle si la página no las usa.
 */

// Fuentes — declaradas al top-level porque next/font lo requiere.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-tenant",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-tenant",
  display: "swap",
});

// Unbounded: display geométrica, muy llamativa. La usa el template "impacto".
const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-tenant",
  display: "swap",
});

// DM Sans: la misma familia que usa el panel, pero expuesta como --font-tenant.
// La usa "prestige". El look premium NO sale de la fuente sino del contraste de
// pesos (300 para body, 700 para títulos) + tracking negativo — ver la escala
// tipográfica scopeada en globals.css.
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-tenant",
  display: "swap",
});

/**
 * Plantillas con layout fijo
 *
 * Por default el home del tenant se arma con las secciones que el dealer
 * configura en /dashboard/sitio-web (filas en DB, con orden y enabled propios).
 * Una plantilla puede en cambio declarar un `layout`: una lista cerrada de
 * bloques, en orden, que ignora el orden/enabled de la DB.
 *
 * Ojo, esto NO ignora el CONTENIDO del dealer: los slots que corresponden a un
 * SectionType siguen leyendo su título, subtítulo, config y media de la fila de
 * la DB. Lo que la plantilla fija es la COMPOSICIÓN, no el texto.
 *
 * Los slots premium no tienen fila en DB: se alimentan del stock publicado que
 * ya viene en el bundle, así que no agregan queries.
 */
export const PREMIUM_SLOTS = [
  "stock-marquee",
  "spotlight",
  "sticky-specs",
  // Los carruseles por categoría (0km, Usados, Oportunidades). En el home
  // configurable se intercalan por ancla; en un layout fijo van agrupados en
  // este slot.
  "collections",
] as const;

export type PremiumSlot = (typeof PREMIUM_SLOTS)[number];

export type TenantLayoutSlot = SectionType | PremiumSlot;

export function isPremiumSlot(slot: TenantLayoutSlot): slot is PremiumSlot {
  return (PREMIUM_SLOTS as readonly string[]).includes(slot);
}

export interface TenantTemplate {
  id: string;
  name: string;
  description: string;
  // Tono general — sirve para el preview en el selector.
  tone: "light" | "dark";
  // next/font object. Exponemos su `variable` para inyectar en className.
  font: typeof poppins;
  // CSS vars que se aplican a `.tenant-scope` como inline style. Los componentes
  // consumen estos tokens con `bg-[var(--tenant-bg)]`, etc.
  tokens: Record<string, string>;
  // Si true, el TenantChrome renderiza la barra de anuncio superior (usa el
  // campo `announcement` del dealership). Solo algunos templates la muestran.
  hasAnnouncementBar?: boolean;
  // Si true, el header es una barra sólida full-width pegada arriba (en vez de la
  // píldora flotante translúcida). Va con el look cuadrado del template "impacto".
  solidHeader?: boolean;
  // Composición fija del home. Si está, pisa el orden/enabled de la DB.
  // Si es undefined, el home usa las secciones configurables del dealer.
  layout?: readonly TenantLayoutSlot[];
}

export const TENANT_TEMPLATES = {
  classic: {
    id: "classic",
    name: "Clásica",
    description:
      "Fondo claro con acentos del color de tu marca. Lectura cómoda, neutral, lo que ya tenías.",
    tone: "light",
    font: poppins,
    tokens: {
      // Backgrounds
      "--tenant-bg": "#f9fafb", // gray-50 — fondo de la página
      "--tenant-surface": "#ffffff", // blanco — cards, navbar, footer
      "--tenant-surface-hover": "#f3f4f6", // gray-100
      // Foreground
      "--tenant-fg": "#0f172a", // slate-900 — texto principal
      "--tenant-fg-muted": "#64748b", // slate-500 — texto secundario
      "--tenant-fg-subtle": "#94a3b8", // slate-400 — eyebrows, labels
      // Borders
      "--tenant-border": "#e5e7eb", // gray-200 — bordes default
      "--tenant-border-strong": "#cbd5e1", // slate-300 — bordes acento
      // Radius
      "--tenant-radius": "0.75rem", // 12px
      "--tenant-radius-sm": "0.5rem", // 8px
      // Shadow level — clásico usa shadow sutil
      "--tenant-shadow-card": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    },
  },
  dark: {
    id: "dark",
    name: "Oscura",
    description:
      "Tonos profundos con tipografía Space Grotesk. Ideal para concesionarios de alta gama y vehículos premium.",
    tone: "dark",
    font: spaceGrotesk,
    tokens: {
      // Backgrounds
      "--tenant-bg": "#0a0e1a", // azul-negro casi puro
      "--tenant-surface": "#111827", // gray-900
      "--tenant-surface-hover": "#1f2937", // gray-800
      // Foreground
      "--tenant-fg": "#f8fafc", // slate-50 — texto principal
      "--tenant-fg-muted": "#94a3b8", // slate-400 — texto secundario
      "--tenant-fg-subtle": "#64748b", // slate-500 — eyebrows, labels
      // Borders — más visibles sobre dark, sutiles
      "--tenant-border": "#1f2937", // gray-800
      "--tenant-border-strong": "#374151", // gray-700
      // Radius — un toque más generoso para acentuar el aire premium
      "--tenant-radius": "1rem", // 16px
      "--tenant-radius-sm": "0.625rem", // 10px
      // Glow en lugar de drop shadow — sobre dark, drop shadow no se ve
      "--tenant-shadow-card": "0 0 0 1px rgb(255 255 255 / 0.04)",
    },
  },
  impacto: {
    id: "impacto",
    name: "Impacto",
    description:
      "Look cuadrado y directo con tipografía Unbounded y un cartel de anuncio arriba. Simple, moderno y que resalta.",
    tone: "light",
    font: unbounded,
    hasAnnouncementBar: true,
    solidHeader: true,
    tokens: {
      // Backgrounds — blanco puro, minimalista
      "--tenant-bg": "#ffffff",
      "--tenant-surface": "#ffffff",
      "--tenant-surface-hover": "#f5f5f5", // neutral-100
      // Foreground — casi negro, alto contraste
      "--tenant-fg": "#0a0a0a", // neutral-950
      "--tenant-fg-muted": "#525252", // neutral-600
      "--tenant-fg-subtle": "#737373", // neutral-500
      // Borders — marcados, para el look boxy
      "--tenant-border": "#e5e5e5", // neutral-200
      "--tenant-border-strong": "#171717", // neutral-900
      // Radius — CERO: esquinas rectas (el override en globals.css aplana los
      // rounded-* hardcodeados dentro de [data-template="impacto"]).
      "--tenant-radius": "0px",
      "--tenant-radius-sm": "0px",
      // Sin drop shadow — el look plano se apoya en bordes, no en sombras.
      "--tenant-shadow-card": "0 0 0 1px rgb(0 0 0 / 0.06)",
    },
  },
  prestige: {
    id: "prestige",
    name: "Prestige",
    description:
      "Composición editorial sobre negro: cada vehículo destacado ocupa la pantalla entera, con fichas que se despliegan al scrollear. Para stock de alta gama.",
    tone: "dark",
    font: dmSans,
    // Composición cerrada: el dealer no reordena ni apaga bloques. El criterio es
    // alternar formato en cada bloque (tira → pieza única → grilla → pin) para que
    // el ojo no se acostumbre. Una grilla atrás de otra es lo que abarata el look.
    layout: [
      "hero",
      "stock-marquee",
      "spotlight",
      "catalog",
      "sticky-specs",
      "collections",
      "brands",
      "reviews",
      "contact",
    ],
    tokens: {
      // Backgrounds — negro neutro (sin tinte azul, a diferencia de "dark"). El
      // gris puro no le compite el color a las fotos de los autos.
      "--tenant-bg": "#08090b",
      "--tenant-surface": "#0f1113",
      "--tenant-surface-hover": "#17191c",
      // Foreground
      "--tenant-fg": "#fafafa", // neutral-50
      "--tenant-fg-muted": "#a1a1aa", // zinc-400
      "--tenant-fg-subtle": "#71717a", // zinc-500
      // Borders — hairline apenas perceptible. Sobre negro, un borde marcado
      // recorta las cards y rompe la continuidad editorial.
      "--tenant-border": "#1f2124",
      "--tenant-border-strong": "#33363a",
      // Radius — casi recto, pero no cero. El 0 absoluto ya lo usa "impacto";
      // estos 4px leen como "imprenta", no como "brutalist".
      "--tenant-radius": "0.25rem",
      "--tenant-radius-sm": "0.125rem",
      // Sobre negro el drop shadow no existe: usamos un hairline superior que
      // simula luz cenital sobre la card.
      "--tenant-shadow-card": "inset 0 1px 0 0 rgb(255 255 255 / 0.04)",
    },
  },
} as const satisfies Record<string, TenantTemplate>;

export type TenantTemplateId = keyof typeof TENANT_TEMPLATES;

export const TENANT_TEMPLATE_IDS = Object.keys(TENANT_TEMPLATES) as TenantTemplateId[];

/**
 * Misma lista que TENANT_TEMPLATE_IDS pero tipada como tupla no vacía, que es lo
 * que pide `z.enum(...)`. Existe para que los validators NO repitan los ids a
 * mano: antes `dealershipUpdateSchema` tenía `["classic","dark","impacto"]`
 * hardcodeado y sumar una plantilla acá dejaba el validator desincronizado.
 */
export const TENANT_TEMPLATE_ID_TUPLE = TENANT_TEMPLATE_IDS as [
  TenantTemplateId,
  ...TenantTemplateId[],
];

/**
 * Resuelve un templateId a su definición. Si el id no es válido (corrupción,
 * id viejo de una plantilla discontinuada), cae a "classic".
 */
export function resolveTemplate(templateId: string | null | undefined): TenantTemplate {
  if (templateId && templateId in TENANT_TEMPLATES) {
    return TENANT_TEMPLATES[templateId as TenantTemplateId];
  }
  return TENANT_TEMPLATES.classic;
}
