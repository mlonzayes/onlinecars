---
name: frontend-design
description: >-
  Dirección visual con intención para cualquier UI nueva o rediseño en motorflow:
  secciones y páginas de la web de marketing, bloques y plantillas del sitio del
  concesionario, y pantallas del panel. Fuerza un plan de diseño (paleta, tipo,
  layout, principios) ANTES de escribir código y lo revisa contra los defaults
  que delatan un diseño generado por IA. Úsala SIEMPRE que se pida crear,
  maquetar, rediseñar, "mejorar", "embellecer" o "hacer menos genérica" una
  página, sección, componente visual, landing o plantilla — aunque no se diga
  "diseño". Complementa a seo-web (esa cubre metadata/estructura; esta, la
  estética).
license: Basada en anthropics/skills (Apache 2.0) — ver LICENSE.txt
---

# Frontend Design — motorflow

Adaptación del skill oficial `frontend-design` de Anthropic a este repo. El
texto original está en [references/upstream-anthropic.md](references/upstream-anthropic.md)
y **hay que leerlo entero antes de diseñar**: ahí están los principios
(tipografía, estructura como información, motion, copy) y la lista de
calibración de lo que hoy delata a un diseño generado. Este archivo agrega lo
que el original no puede saber: en qué superficie estás, qué tokens ya existen
y qué no se puede tocar.

Postura: sos el lead de diseño de un estudio que le da a cada cliente una
identidad que no se confunde con la de nadie. Elecciones deliberadas y con
opinión — pero **dentro de los límites de la superficie**.

---

## 0. Primero: ¿en qué superficie estás?

Son tres, con reglas distintas. Equivocarse acá es el error más caro: un dealer
que abre su sitio y lo encuentra con la estética de motorflow abre un ticket.

| Superficie | Rutas | Quién define la estética | Cuánta audacia |
|---|---|---|---|
| **Marketing** | `src/app/(marketing)/`, `src/components/landing/` | Nosotros (identidad de motorflow) | Alta. Es donde se gasta la audacia. |
| **Sitio del tenant** | `src/app/tenant/[slug]/`, `src/components/tenant/` | La **plantilla** (`templateId`) + la marca del dealer | Dentro de la plantilla. Nunca inventar paleta. |
| **Panel** | `src/app/dashboard/`, `src/app/admin/`, `src/components/dashboard/` | shadcn/ui + patrones de `CLAUDE.md` | Baja. Claridad y densidad > personalidad. |

Detalle de tokens, fuentes y componentes de cada una en
[references/motorflow-surfaces.md](references/motorflow-surfaces.md). Leelo
antes del plan.

### Marketing
Acá aplica el skill original completo. Cliente: concesionarios chicos y
medianos de Argentina que hoy dependen de MercadoLibre. El trabajo de la página
es que un dueño de agencia — no un diseñador, no un dev — entienda en segundos
que puede tener su propio sitio sin comisiones. El vocabulario visual sale del
mundo del auto usado argentino (playón, patente, ficha técnica, la foto del auto
de frente en la vereda), no del de "SaaS genérico".

### Sitio del tenant
- **Los colores salen de `var(--tenant-*)`**, nunca de hex ni de clases de
  Tailwind con color (`bg-blue-600`). El primario es el del dealer.
- **La fuente sale de `--font-tenant`**. No declarar fuentes nuevas acá: van en
  `src/lib/tenant-templates.ts` (top-level, `preload: false`).
- Un componente nuevo tiene que verse bien en **las 4 plantillas** (`classic`,
  `dark`, `impacto` con radius 0, `prestige` con su escala editorial). Revisarlo
  mentalmente en cada una antes de darlo por terminado.
- Si lo que se pide es una **estética nueva**, eso es una **plantilla nueva** en
  `TENANT_TEMPLATES`, no estilos sueltos en un componente.
- Restricciones de render (ISR) del CLAUDE.md siguen valiendo: nada de
  `headers()`, `cookies()`, Redis ni `searchParams` en el render.

### Panel
- shadcn/ui primero (`src/components/ui/`). Los 12 patrones de "nuevas pantallas
  del dashboard" del CLAUDE.md mandan sobre cualquier idea de este skill.
- La audacia acá es **jerarquía y copy**, no decoración: qué número se ve
  primero, qué acción es la primaria, qué dice el empty state.
- La sección "More on writing in design" del original aplica 100% (CTAs con
  verbo, errores que dicen cómo resolver, empty states que invitan a actuar) —
  en español rioplatense, sentence case.

---

## 1. Proceso (no saltear pasos)

1. **Superficie** — decidir cuál de las tres (sección 0).
2. **Brief** — sujeto concreto, audiencia y el *único* trabajo de la pantalla.
   Si el pedido no lo dice, proponerlo y confirmarlo con el usuario.
3. **Plan de diseño** (en el chat, antes de código), como pide el original:
   - Color: 4–6 valores con nombre. En tenant → qué tokens `--tenant-*` usa
     cada rol. En panel → qué tokens de shadcn.
   - Tipo: familias y roles. En tenant/panel ya vienen dadas: definir **escala
     y pesos**, no familias.
   - Layout: una frase + wireframe ASCII. Alineación explícita.
   - Principios: qué hace única a *esta* pantalla. Y **dónde se gasta la
     audacia** (un solo lugar).
4. **Revisión del plan** — contrastarlo con la lista de calibración del
   original y con los anti-patrones de abajo. Si una parte sale igual a lo que
   harías para cualquier otro cliente, cambiarla y decir qué cambiaste.
5. **Build** — respetando las reglas duras (sección 3).
6. **Autocrítica** — mobile, foco de teclado visible, `prefers-reduced-motion`,
   contraste, y ver el resultado corriendo (skill `run`) si es posible.

---

## 2. Anti-patrones ya vistos en este repo

Además de la lista del original. Son cosas que **ya están** en el código y que
no hay que replicar en lo nuevo (y conviene corregir cuando se toca el archivo):

- **Una palabra del título en otro color** (`<span className="text-blue-600">`).
  El original lo marca como la seña más común de página generada.
- **Glows azules difusos animados** detrás del hero (`floating-orbs`,
  `hero-glow`). Decoración que no dice nada del mundo del auto.
- **Eyebrows en mayúsculas con tracking** arriba de cada `h2`.
- **Fade-and-slide-up en cada sección** (`FadeIn`, `ScrollReveal`) y
  `TiltCard` en cada card. Un solo momento orquestado > efectos sueltos.
- **Fila de 3 cards iguales** con ícono + título + texto para features.
- **Todo en `blue-600`** como acento por defecto en marketing.

---

## 3. Reglas duras (no negociables, ganan sobre el skill original)

- **No instalar librerías** (fuentes de Google vía `next/font` incluidas — se
  pregunta antes). Íconos: `react-icons` (`pi` = Phosphor, ya en uso) y
  `lucide-react`. Animación: GSAP vía `src/lib/gsap.ts` con sus tokens
  (`DURATION`, `EASE`, `REVEAL_*`). No sumar Framer Motion.
- **Fuentes**: prohibidas Inter, Arial y Roboto como principal.
- **El elemento LCP no se anima** (ver comentario en `hero-section.tsx`): nada
  de opacity 0 → 1 vía JS sobre la imagen o el título del hero.
- **Colores como CSS variables / tokens**, nunca hex sueltos en componentes del
  tenant ni del panel.
- **Archivos < 200 líneas, un componente por archivo**, Server Components por
  default (`"use client"` solo para la parte interactiva).
- **Strings de UI en español**, sin "(opcional)" en labels (asterisco en los
  obligatorios).
- **Contenido real**: autos, precios en ARS/USD con formato argentino, patentes,
  ciudades del interior. Nada de lorem ipsum ni "Acme Motors".
- Si la página es nueva o cambia su estructura: correr también **seo-web**.

---

## 4. Skills relacionados

- [redesign-audit](../redesign-audit/SKILL.md) — para auditar y mejorar algo
  que **ya existe** sin reescribirlo.
- [ux-review](../ux-review/SKILL.md) — heurísticas y carga cognitiva; para
  forms y flujos de conversión.
- [seo-web](../seo-web/SKILL.md) — metadata, headings, JSON-LD.
