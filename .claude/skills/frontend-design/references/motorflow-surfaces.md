# Superficies de motorflow — qué ya existe

Referencia para el plan de diseño. Si algo de acá quedó desactualizado, el
código manda: verificar en los archivos citados y corregir este archivo en el
mismo commit.

---

## Marketing (`motorflowapp.com`)

- **Rutas**: `src/app/(marketing)/` — landing, `/precios`, `/blog`, legales.
  Página nueva de marketing → dentro de este route group (si no, no se mide:
  ver `.claude/rules/tracking.md`).
- **Componentes**: `src/components/landing/` y `src/components/shared/`.
- **Fuente**: DM Sans vía `next/font` en `src/app/layout.tsx`, expuesta como
  `--font-sans`. El `<html>` arranca en `font-light` (300): el contraste se
  gana con el peso del display, no del body.
- **Color hoy**: no hay tokens propios de marketing; se usa Tailwind directo
  con `blue-600` como acento casi en todos lados. Si un rediseño define una
  paleta de marca, declararla como CSS variables (en `globals.css`, con scope
  de marketing) en vez de seguir sumando clases `blue-*`.
- **Motion**: GSAP con los tokens de `src/lib/gsap.ts` (`DURATION`, `EASE`,
  `Y_OFFSET`, `DEFAULT_START`). Wrappers existentes: `fade-in.tsx`,
  `scroll-reveal.tsx`, `text-reveal.tsx`, `tilt-card.tsx`. Usarlos con
  criterio — hoy están en casi todas las secciones, que es justamente el
  patrón genérico a evitar.
- **LCP**: el hero no se anima (comentario en `hero-section.tsx`).
- **Contacto público**: `SITE_*` de `src/lib/seo.ts`; CTA principal con
  `getPrimaryCta()`. No hardcodear teléfonos ni links de WhatsApp.

## Sitio del tenant (`{slug}.motorflowapp.com`)

- **Rutas**: `src/app/tenant/[slug]/`. **Componentes**: `src/components/tenant/`
  (+ `premium/` para los bloques de `prestige`).
- **Plantillas**: `src/lib/tenant-templates.ts` → `TENANT_TEMPLATES`.

  | id | Tono | Fuente | Rasgo |
  |---|---|---|---|
  | `classic` | claro | Poppins | Neutral, acentos del color de la marca |
  | `dark` | oscuro | Space Grotesk | Tonos profundos, alta gama |
  | `impacto` | claro | Unbounded | Radius 0 (forzado en `globals.css`), header sólido, barra de anuncio |
  | `prestige` | oscuro | DM Sans | Layout fijo editorial, escala tipográfica propia, reveals por clip-path |

- **Tokens** (los aplica `TenantChrome` como inline style sobre `.tenant-scope`):
  `--tenant-bg`, `--tenant-surface`, `--tenant-surface-hover`, `--tenant-fg`,
  `--tenant-fg-muted`, `--tenant-fg-subtle`, `--tenant-border`,
  `--tenant-border-strong`, `--tenant-radius`, `--tenant-radius-sm`,
  `--tenant-shadow-card`. De la marca del dealer: `--tenant-primary`,
  `--tenant-primary-dark` y **`--tenant-primary-text`** (versión del primario
  con contraste ≥ 4,5:1 sobre el fondo de la plantilla — usarla para TEXTO;
  `--tenant-primary` para fondos y bordes).
- **Fuente**: `--font-tenant` (la aplica `.tenant-scope`).
- **Hooks de `prestige`** en `globals.css`: `[data-display="xl"]` para un
  display gigante y `[data-numeric]` para cifras tabulares (precios, km, specs).
- **Contenido portaleado** (Sheet, Dialog) se renderiza fuera de
  `.tenant-scope`: hereda solo los defaults de `:root` (tema classic). Probar
  esos casos en plantillas oscuras.
- **Composición**: el home se arma con `DealershipSection` (configurable) salvo
  que la plantilla declare `layout` fijo. Diseñar un bloque nuevo implica
  decidir si es una `SectionType` o un `PremiumSlot`.

## Panel (`/dashboard`, `/admin`)

- **Componentes**: shadcn/ui sobre Base UI en `src/components/ui/` (badge,
  button, card, dialog, dropdown-menu, select, sheet, sidebar, skeleton, table,
  tabs, tooltip, confirm-dialog, …). Revisar la lista antes de crear algo.
- **Tokens**: los de shadcn en `globals.css` (`--background`, `--primary`,
  `--muted`, `--border`, `--radius`, …) con variante `.dark`.
- **Patrones obligatorios**: los 12 de "Patrones para nuevas pantallas del
  dashboard" en `CLAUDE.md` + `.claude/rules/table-filters.md` para listados.
- **Gráficos**: skill `dataviz` + `src/components/dashboard/charts/`.

## Íconos y animación (las tres superficies)

- Íconos: `react-icons/pi` (Phosphor) en marketing; `lucide-react` en el panel
  (viene con shadcn) y en el sitio del tenant. Seguir el set de la superficie:
  uno solo por pantalla, mismo grosor de trazo.
- Animación: GSAP (`src/lib/gsap.ts`) + `tw-animate-css` para transiciones
  simples. Respetar `prefers-reduced-motion` y el gating por breakpoint
  (`DESKTOP_MOTION_QUERY`) para pins y scrubs.
