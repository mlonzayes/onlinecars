# Tenant Site Redesign — Plan de implementación

Documento vivo. Referencia para todas las sesiones del rediseño del sitio público
del concesionario (`/tenant/[slug]/...`).

**Referencia visual:** https://demoapus1.com/boxcar/
**Filosofía:** Simple, moderno, funcional. Estética profesional automotriz.
**Fuente:** Poppins (confirmado por usuario).

---

## Decisiones tomadas (asumidas — confirmar si algo no cierra)

| # | Decisión | Razón |
|---|----------|-------|
| 1 | **Scope = TODAS las pages del tenant** (home, catálogo, detalle, contacto, opinion) | Confirmado por el usuario (opción C) |
| 2 | **Color primario del dealer aplica a CTAs/accents** | Branding por tenant, neutrales fijos en el template |
| 3 | **Poppins** vía `next/font/google` | Auto-optimized, sin tag manual |
| 4 | **NO agregamos campos al schema** (sin `originalPrice` ni `priceTag` por ahora) | Confirmado por el usuario: solo rediseño visual. Badges se incorporan más adelante. |
| 5 | **SDD** invocado con `/sdd-new redesign-tenant`, pero workflow iterativo en paralelo | Este doc cumple rol de spec/design hasta formalizar engram |
| 6 | **Features que NO clonamos por ahora:** blog, calculadora financiera, comparador, "submit listing", "vender tu auto", login en frontend público, newsletter funcional | Confirmado: se sumarán en futuras iteraciones si hace falta |
| 7 | **Mantenemos:** WhatsApp FAB (extra que ya tenías, está bueno) | Funciona y diferencia |

> Si alguna decisión no te cierra, decímelo antes de arrancar y la cambio.

---

## Mini Design System

### Tipografía (Poppins)

| Token | Tailwind | Uso |
|---|---|---|
| Display | `text-5xl sm:text-6xl font-bold leading-tight` | Hero h1 |
| H1 | `text-3xl sm:text-4xl font-bold leading-tight` | Page titles |
| H2 | `text-2xl sm:text-3xl font-semibold leading-snug` | Section titles |
| H3 | `text-lg sm:text-xl font-semibold` | Card titles |
| Body | `text-base font-normal leading-relaxed` | Párrafos |
| Small | `text-sm font-medium text-slate-500` | Specs, metadata |
| Tiny | `text-xs font-medium uppercase tracking-wider` | Eyebrows, badges |

### Colores

```css
/* Multi-tenant — varía por dealer */
--tenant-primary: theme.colorPrimary || #2563eb;
--tenant-primary-foreground: #ffffff;

/* Fijos del template */
--neutral-900: #0F172A;  /* títulos */
--neutral-700: #334155;  /* body */
--neutral-500: #64748B;  /* muted */
--neutral-300: #CBD5E1;  /* borders */
--neutral-100: #F1F5F9;  /* backgrounds suaves */
--neutral-50:  #F8FAFC;  /* sections alternadas */

/* Semánticos */
--success: #10B981;  /* Great Price badge */
--warning: #F59E0B;  /* Sale badge */
--info:    #3B82F6;  /* Low Mileage badge */
```

### Espaciado

- **Container:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Section padding vertical:** `py-16 sm:py-20 lg:py-24`
- **Gap cards listing:** `gap-5 sm:gap-6`
- **Gap dentro de cards:** `gap-3 sm:gap-4`

### Sombras

- Card normal: `shadow-sm`
- Card hover: `hover:shadow-md`
- Elevated (modal/dropdown): `shadow-xl`
- No glow excesivo

### Patrón de Section reutilizable

```tsx
<section className="py-16 sm:py-20 lg:py-24">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <header className="mb-10 sm:mb-12 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--tenant-primary)]">
        Eyebrow
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
        Título
      </h2>
      <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto">
        Descripción opcional
      </p>
    </header>
    {/* Content */}
  </div>
</section>
```

Secciones alternan fondo: `bg-white` → `bg-slate-50` → `bg-white`.

---

## Fases de implementación

### Fase 1 — Foundations (1 sesión)

**Objetivo:** que la base esté lista para todo lo demás.

**Tareas:**
1. Editar `src/app/tenant/[slug]/layout.tsx`:
   - Cargar Poppins con `next/font/google` (weights 400, 500, 600, 700)
   - Inyectar CSS vars del theme del dealer:
     ```tsx
     <style>{`:root { --tenant-primary: ${theme?.colorPrimary ?? '#2563eb'}; }`}</style>
     ```
   - Wrap children en un container con `font-poppins`
2. ~~Migración Prisma~~ — descartada por ahora (sin campos nuevos)
3. ~~Constants de price tags~~ — descartado por ahora
4. Refactor `tenant-header.tsx` al estilo Boxcar:
   - Sticky top
   - Logo izquierda + nav central + WhatsApp/Contacto derecha
   - Mobile: hamburger
5. Componente nuevo `src/components/tenant/section.tsx` — wrapper reutilizable con el patrón de arriba.

**Done cuando:** se ve Poppins en el tenant, el color primario del dealer está aplicado a todos los CTAs/links activos, y el header se ve como Boxcar.

---

### Fase 2 — Home (1-2 sesiones)

**Objetivo:** rediseño completo de `/tenant/[slug]` (home).

**Decisiones confirmadas:**
- ✅ Agregamos campo `bodyType` al modelo Vehicle (con su migración)
- ❌ NO incluimos newsletter (ni UI ni backend)

**Componentes nuevos:**
- `tenant/hero-search.tsx` — Hero con bg image/gradient + título + search bar inline (Marca / Modelo / Precio)
- `tenant/categories-grid.tsx` — 5 cards con icon+label (filtran por `bodyType`)
- `tenant/featured-tabs.tsx` — Tabs (En stock / Nuevos / Usados) que filtran vehicles destacados
- `tenant/why-choose-us.tsx` — 4 features con íconos (Financiación, Confianza, Precios, Servicio)
- `tenant/cta-banner.tsx` — banner full-width con título grande + CTA

**Refactor:**
- `tenant/brands-carousel.tsx` → `brands-grid.tsx` (Boxcar usa grid de 6, no carousel)
- `tenant/tenant-footer.tsx` → 4 columnas (Concesionario / Links / Marcas / Contacto) + social

**Data foundations (antes de las secciones):**
- Migración Prisma: agregar `bodyType: String?` al modelo Vehicle
- Constants: `VEHICLE_BODY_TYPES` con labels en español e íconos
- Update Zod validator de vehicle para aceptar bodyType
- Update vehicle-form.tsx (dashboard) para incluir el campo
- Update `lib/tenant.ts` `getPublishedVehicles` para soportar filtro por bodyType

**Page final** `tenant/[slug]/page.tsx` orquesta:
1. HeroSearch
2. CategoriesGrid
3. BrandsGrid
4. FeaturedTabs (vehicles destacados)
5. CTABanner ("¿Buscás tu próximo auto?")
6. WhyChooseUs
7. ReviewsCarousel (existente)
8. TenantFooter rediseñado

**Done cuando:** la home se ve casi idéntica a Boxcar, scrolleando bien en mobile, los datos son del dealer real.

---

### Fase 3 — Catálogo (1 sesión)

**Objetivo:** `/tenant/[slug]/catalogo` con look Boxcar.

**Cambios:**
- `tenant/vehicle-card.tsx` — agregar badge (`VehicleBadge` componente nuevo) que lee `priceTag`. Si hay `originalPrice`, mostrar tachado al lado del price actual.
- `tenant/vehicle-badge.tsx` (nuevo) — pill con color según tag
- `tenant/vehicle-filters.tsx` — pulir, alinear con Boxcar (más espaciado, inputs más grandes)
- `tenant/[slug]/catalogo/page.tsx` — sort options arriba ("Más recientes", "Precio asc/desc", "Menos km")

**Heads-up:**
- Sorting requiere parsear querystring nuevo (`?sort=`)
- En vehicle-card mostrar también la transmisión si existe (Boxcar lo muestra)

---

### Fase 4 — Detalle (1 sesión)

**Objetivo:** `/tenant/[slug]/vehiculo/[id]` con look Boxcar.

**Layout:** 2 columnas en desktop (gallery 60% / sticky info panel 40%), stack en mobile.

**Componentes:**
- `vehicle-gallery.tsx` (existente) — mantener pero ajustar proporciones
- `tenant/vehicle-specs-grid.tsx` (nuevo) — grid 2-3 cols con icon + label + value
- `tenant/vehicle-price-card.tsx` (nuevo) — sticky en desktop, contiene precio (con tachado), badge, CTAs (WhatsApp, formulario contacto, llamar)
- Sección "Descripción" con tipografía mejorada
- Sección "Vehículos similares" abajo (3 cards)

**Heads-up:**
- "Vehículos similares" requiere query nueva en `lib/tenant.ts`: misma marca o mismo rango de precio (±20%), excluir el actual, take 3.

---

### Fase 5 — Polish (sesión final)

- Loading skeletons (con `bg-slate-200 animate-pulse`)
- Animaciones de entrada sutiles (fade-in con `animate-in fade-in-0` de tw-animate-css que ya tenés)
- Hover states finos en cards (lift sutil, no exagerado)
- Mobile audit completo
- Lighthouse / accesibilidad (alt text, contraste, focus rings)
- Open Graph tags para compartir vehículos en WhatsApp

---

## Convenciones específicas del rediseño

### 1. Cómo usar el theme del dealer en componentes

```tsx
// CTAs principales
<button className="bg-[var(--tenant-primary)] text-white">

// Links activos
<Link className="text-[var(--tenant-primary)] hover:underline">

// Borders highlight
<div className="border-[var(--tenant-primary)]">

// NO usar el primary para áreas grandes (fondos enormes), sólo accents.
```

### 2. Cómo cargar Poppins

```tsx
// src/app/tenant/[slug]/layout.tsx
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export default async function TenantLayout({ children, params }) {
  // ...
  return (
    <div className={`${poppins.variable} font-sans tenant-scope`}>
      {children}
    </div>
  );
}
```

```css
/* globals.css — scope a tenant para no afectar dashboard */
.tenant-scope {
  font-family: var(--font-poppins), system-ui, -apple-system, sans-serif;
}
```

### 3. Patrón de badges en VehicleCard

```tsx
const BADGE_STYLES: Record<VehiclePriceTag, string> = {
  great_price: "bg-emerald-100 text-emerald-800",
  sale:        "bg-amber-100 text-amber-900",
  low_mileage: "bg-blue-100 text-blue-800",
};

{vehicle.priceTag && (
  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${BADGE_STYLES[vehicle.priceTag]}`}>
    {PRICE_TAG_LABELS[vehicle.priceTag]}
  </span>
)}

{/* Precio con tachado opcional */}
<div className="flex items-baseline gap-2">
  <span className="text-xl font-bold text-slate-900">{formatPrice(vehicle.price)}</span>
  {vehicle.originalPrice && (
    <span className="text-sm text-slate-400 line-through">{formatPrice(vehicle.originalPrice)}</span>
  )}
</div>
```

### 4. Mobile-first

Toda media query empieza desde mobile (sin prefix) y agrega `sm:` (640px+), `md:` (768px+), `lg:` (1024px+). NO al revés.

### 5. Imágenes

Seguir usando `next/image` con `fill`, `sizes` apropiado. Aspect ratios:
- Hero: `aspect-[16/9]` o `aspect-[21/9]`
- Card listing: `aspect-[4/3]`
- Detail gallery: `aspect-[16/10]`

---

## Riesgos y heads-ups

- **Migración Prisma en Fase 1**: necesitás correr `pnpm exec prisma migrate dev --name add_price_tag_to_vehicle`. Es additive (campos nullable), no rompe data existente.
- **Editar vehículo en dashboard**: Fase 3 también requiere agregar al `vehicle-form.tsx` (dashboard) los inputs para `originalPrice` y `priceTag`. Sino el dealer no puede setearlos.
- **Multi-tenant testing**: probar con un dealer con `theme.colorPrimary` custom y uno con default — no debe romper.
- **Newsletter endpoint**: si lo agregamos en Fase 2, va a `/api/public/tenant/[slug]/newsletter` con tabla nueva `NewsletterSubscriber` (o reusar `WaitlistEntry` con un campo `source`). Decidir antes.
- **Categorías por bodyType**: si vamos por agregar `bodyType` al modelo, es otra migración. Alternativa: por ahora hardcodear las categorías y filtrar por título (ej: si title contiene "SUV"). Decidir antes de Fase 2.

---

## Workflow por sesión

1. Sesión nueva → leer este doc para recuperar contexto
2. Confirmar fase a trabajar
3. Implementar (commit-by-commit, no en bloque)
4. Probar en dev en localhost (con al menos un dealer con datos)
5. Mobile check (DevTools responsive)
6. Marcar fase como ✅ en este doc cuando termine

---

## Estado de las fases

- [x] Fase 1 — Foundations *(2026-04-29)*
  - Poppins cargada en `tenant/[slug]/layout.tsx` con `next/font/google`, weights 400/500/600/700
  - `.tenant-scope` definido en `globals.css` aplicando `--font-poppins`
  - Componente `<Section>` reusable creado en `components/tenant/section.tsx` (props: background, padding, eyebrow, title, description, align, id)
  - `tenant-header.tsx` refactoreado: Client Component con state, sticky, logo + nav + CTA WhatsApp/Contactar + mobile hamburger con scroll lock
  - **API change**: `TenantHeader` ahora recibe `name`, `logo`, `whatsapp`, `basePath` por separado (no el objeto Dealership) para evitar arrastrar Date fields al boundary client.
- [x] Fase 2 — Home *(2026-05-03)*
  - **Data foundations**: agregado `bodyType: String?` al modelo `Vehicle` (migración `20260429183000_add_body_type_to_vehicle`), constants `VEHICLE_BODY_TYPES` + labels en `lib/constants.ts`, validador Zod actualizado, `getPublishedVehicles` ahora soporta filtro por `bodyType`, `vehicle-form.tsx` del dashboard incluye el select.
  - **Componentes nuevos**: `hero-search.tsx` (hero + search bar Marca/Condición/Precio), `categories-grid.tsx` (7 cards por bodyType), `brands-grid.tsx` (6 marcas en grid, reemplaza al carousel), `featured-tabs.tsx` (tabs En stock/0km/Usados), `why-choose-us.tsx` (4 features), `cta-banner.tsx` (banner full-width con CTA).
  - **Footer rediseñado**: 4 columnas (Brand info | Navegación | Contacto), API también refactoreada para recibir campos sueltos en vez del objeto `Dealership`.
  - **VehicleCard**: tipo flexibilizado a `VehicleCardData` (acepta Decimal o string para price), reusable desde server y client.
  - **Home orquestada**: `tenant/[slug]/page.tsx` reescrito usando `<Section>` para mantener consistencia, secciones alternan `bg-white` ↔ `bg-slate-50`.
- [x] Fase 3 — Catálogo *(2026-05-03)*
  - `VehicleBadge` creado y `VehicleCard` modificado para aceptar `priceTag` y `originalPrice` sin alterar Prisma.
  - Filtros estilizados según Boxcar (mayor padding, textos y selectores más grandes).
  - Añadido componente `VehicleSort` en `tenant/[slug]/catalogo/page.tsx` para permitir ordenar por Precio, Km, o Destacados (defecto).
- [ ] Fase 4 — Detalle
- [ ] Fase 5 — Polish

---

## Decisiones pendientes (preguntar al usuario antes de cada fase)

**Antes de Fase 2:**
- Categorías: ¿agregamos `bodyType` al modelo o hardcodear+filtrar por título?
- Newsletter: ¿lo activamos ya o lo dejamos como UI sin backend?

**Antes de Fase 3:**
- Sort options: ¿default "más recientes" o "destacados primero"?
- Vista grid vs lista: ¿solo grid o ambas opciones?

**Antes de Fase 4:**
- "Vehículos similares": ¿matching por marca, por rango de precio, o mix?
- ¿Botón "Pedir test drive" además del WhatsApp?
