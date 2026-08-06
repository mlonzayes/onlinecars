import { Poppins, Space_Grotesk, Unbounded } from "next/font/google";

/**
 * Sistema de plantillas del sitio público del tenant.
 *
 * Cada plantilla define:
 *  - Un conjunto de CSS variables (colores, surfaces, bordes, radius) que
 *    los componentes del tenant consumen vía `bg-[var(--tenant-bg)]`, etc.
 *  - Una fuente cargada con next/font (auto-tree-shake: si nadie la usa,
 *    no llega al bundle).
 *
 * Para sumar una plantilla nueva:
 *  1. Agregar la entrada a TENANT_TEMPLATES (id + name + description + font + tokens)
 *  2. Sumar el id al enum del validator (src/lib/validators/dealership.ts)
 *  3. Ya está — el layout aplica los tokens automáticamente
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
