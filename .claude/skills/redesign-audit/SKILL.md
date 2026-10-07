---
name: redesign-audit
description: >-
  Audita una página o componente de motorflow que YA existe, lista lo que se ve
  genérico o sin terminar (tipografía, color, layout, estados, copy, motion) y
  aplica mejoras puntuales sin reescribir ni romper funcionalidad. Úsala cuando
  se pida "mejorar", "pulir", "revisar el diseño", "hacer menos genérica" o
  "llevar a nivel premium" una pantalla existente — landing, sección del
  tenant o pantalla del panel. Para diseñar algo desde cero, frontend-design.
license: Adaptada de Leonxlnx/taste-skill (redesign-skill), MIT — ver LICENSE
---

# Redesign audit — motorflow

Adaptado de `redesign-skill` de [Taste Skill](https://github.com/Leonxlnx/taste-skill)
(MIT). Se sacaron los consejos que chocan con este repo (cambiar el set de
íconos, imágenes de placeholder externas, grano/glassmorphism por default) y se
sumaron los anti-patrones propios.

**Antes de auditar, leé** [frontend-design](../frontend-design/SKILL.md) —
sección 0 (superficies) y sección 2 (anti-patrones del repo). La superficie
define qué se puede tocar: en el sitio del tenant no se cambia la paleta, se
corrige el uso de los tokens.

## Proceso

1. **Escanear** — leer la página y sus componentes. Identificar superficie,
   tokens en uso y qué wrappers de motion aparecen.
2. **Diagnosticar** — recorrer el checklist de abajo. Entregar la lista en el
   chat agrupada por categoría, con `archivo:línea`, **antes** de tocar código.
3. **Priorizar** — orden de abajo. Si el usuario no pidió lo contrario,
   proponer los 3–5 cambios de más impacto y confirmar.
4. **Arreglar** — cambios chicos y revisables, sobre el stack existente. No
   reescribir desde cero. Commits atómicos por categoría.
5. **Verificar** — `pnpm lint` + `pnpm exec tsc --noEmit`, y verlo corriendo
   (skill `run`) en mobile y desktop. En tenant: en las 4 plantillas.

## Checklist

### Tipografía
- Título sin presencia: display chico, tracking suelto, line-height de body.
  Display grande → tracking negativo (`tracking-tight`) y `leading-[1.05]`.
- Párrafos de más de ~70 caracteres de ancho (`max-w-prose` / `max-w-xl`).
- Solo 400 y 700: sumar 500/600 para jerarquía sutil (respetando que la base
  de marketing es 300).
- Precios, km, años y specs en cifras proporcionales: `tabular-nums` (en
  `prestige`, `data-numeric`).
- Palabras huérfanas en títulos: `text-balance`; en párrafos, `text-pretty`.
- MAYÚSCULAS con tracking como eyebrow de cada sección. Sacarlas o dejarlas
  solo donde el label informa algo.
- Una palabra del título resaltada en otro color o peso.

### Color y superficies
- Hex o clases con color (`bg-blue-600`) en componentes del tenant → tokens
  `--tenant-*`. Texto con el primario del dealer → `--tenant-primary-text`.
- Más de un acento compitiendo. Uno solo.
- Grises cálidos y fríos mezclados (`gray-*` con `slate-*` / `zinc-*`).
- Gradientes y glows como decoración sin función.
- La misma sombra gris suave en todo. La elevación tiene que comunicar
  jerarquía; si no, sacarla.
- Una sección oscura suelta en una página clara (o al revés) sin razón.

### Layout
- Todo centrado y simétrico. Probar alineado a la izquierda con eje claro.
- Fila de 3 cards iguales para features. Alternativas: lista con jerarquía,
  zig-zag 2 columnas, una pieza grande + secundarias.
- `h-screen` / `100vh` → `min-h-dvh` (barra de URL en iOS).
- Sin contenedor con ancho máximo.
- Mismo `rounded-*` en todo: más cerrado adentro, más abierto en contenedores.
  (En `impacto` el radius es 0 siempre.)
- CTAs de cards a distinta altura: anclarlos abajo (`mt-auto` en flex-col).
- En pricing y comparativas, listas de features que arrancan a distinta Y.
- Padding vertical idéntico arriba y abajo cuando ópticamente pide más abajo.

### Estados e interacción
- Botones sin hover, sin feedback de presión, sin foco visible.
- Transiciones de 0ms o animando `top/left/width/height` → `transform` y
  `opacity`.
- Sin loading: en el panel, `Skeleton` con la forma del contenido; en listados,
  `TableTransitionOverlay`.
- Empty states vacíos. Deben decir qué pasa y qué hacer, con la acción.
- Errores de form con `alert()` o genéricos. Inline, explicando cómo resolver.
  Confirmaciones destructivas → `ConfirmDialog`, nunca `confirm()`.
- Links a `#` o botones muertos.
- Nav sin indicador de página actual.

### Motion
- Fade-up en cada sección y tilt/hover en cada card. Dejar **un** momento
  orquestado y sacar el resto.
- Animación sobre el elemento LCP (hero). Prohibido.
- Sin respeto a `prefers-reduced-motion` o efectos pesados en mobile (usar
  `DESKTOP_MOTION_QUERY` de `src/lib/gsap.ts`).

### Contenido
- Lorem ipsum, "Juan Pérez", "Acme Motors", números redondos inventados.
  Usar datos verosímiles del mercado argentino.
- Clichés: "potenciá", "llevá tu negocio al siguiente nivel", "solución
  integral", "revolucioná". Lenguaje concreto: qué hace y para quién.
- Signos de exclamación en mensajes de éxito; "¡Ups!" en errores.
- Title Case En Los Títulos → sentence case.
- Labels con "(opcional)" → asterisco en los obligatorios.

### Componentes cliché
- Card = borde + sombra + fondo blanco para todo.
- Siempre botón lleno + botón ghost. Probar link de texto como secundario.
- FAQ en acordeón como única opción (evaluar lista abierta si son pocas).
- Testimonios en carrusel de 3 con puntitos.
- Pricing de 3 torres donde el recomendado solo es más alto.
- Modal para acciones simples que podrían ser inline o un `Sheet`.

### Código
- Div soup → `<section>`, `<nav>`, `<article>`, `<header>`.
- `alt` vacío o genérico en imágenes con contenido (fotos de autos: marca,
  modelo, año).
- `z-[9999]` y valores arbitrarios repetidos que deberían ser token.
- Archivo > 200 líneas → extraer subcomponentes.

## Prioridad de arreglo

1. **Tipografía** (escala, pesos, ancho de línea) — más impacto, menos riesgo.
2. **Color** — limpiar acentos y pasar a tokens.
3. **Estados** — hover, foco, loading, empty, error.
4. **Layout y espaciado** — contenedor, ritmo vertical, alineaciones.
5. **Componentes cliché** — reemplazar los patrones genéricos.
6. **Motion** — reducir a un momento con intención.
7. **Copy** — al final, pero no se saltea.

## Reglas

- Mismo stack: Tailwind v4 + shadcn/Base UI + GSAP. Nada de librerías nuevas
  sin preguntar (incluye fuentes e íconos).
- No romper funcionalidad: tracking de Meta/Clarity, honeypot de los forms,
  `getPrimaryCta()`, JSON-LD y metadata siguen intactos.
- Si cambia la estructura de headings o el copy del hero, pasar también por
  `seo-web`.
