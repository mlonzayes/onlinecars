---
name: seo-web
description: >-
  Diseña, construye o audita páginas de motorflow (landing y blog del dominio de
  marketing, o el sitio público del concesionario) para que cumplan 26 buenas
  prácticas de SEO on-page, datos estructurados, SEO técnico y analítica, usando
  la infra de Next.js App Router que YA existe en el repo (generateMetadata,
  MetadataRoute, el componente JsonLd, getTenantPublicUrl). Úsala SIEMPRE que se
  pida crear/maquetar/rediseñar una página, sección o landing, escribir una nota
  de blog, tocar metadata, sitemap, robots o JSON-LD, o revisar/mejorar una
  página existente — aunque NO se diga "SEO", "posicionamiento" ni "optimizar".
---

# SEO Web — motorflow (Next.js App Router)

26 buenas prácticas de SEO, traducidas a cómo se hacen **en este repo**. No es
una checklist para pegar al final: son decisiones que se toman **mientras** se
define, escribe y maqueta la página.

> **Nada de HTML crudo.** En App Router no se escriben `<title>`, `<meta>` ni
> `<link rel="canonical">` a mano — los genera Next desde el objeto `Metadata`.
> Si te encontrás escribiendo un `<head>`, parás: estás peleando contra el
> framework y el resultado se duplica con el que emite Next.

---

## 0. Dos superficies que NO se mezclan

Mismo criterio que [tracking.md](../../rules/tracking.md): son dos sitios
distintos que viven en el mismo repo.

| | **Marketing** | **Tenant** |
|---|---|---|
| Dominio | `motorflowapp.com` | `{slug}.motorflowapp.com` |
| Rutas | `src/app/(marketing)/` | `src/app/tenant/[slug]/` |
| URL base | `SITE_URL` de [lib/seo.ts](../../../src/lib/seo.ts) | `getTenantPublicUrl(dealership)` de [lib/tenant.ts](../../../src/lib/tenant.ts) |
| robots / sitemap | `app/robots.ts` · `app/sitemap.ts` (convención `MetadataRoute`) | route handlers bajo `tenant/[slug]/` |
| Analítica | Meta Pixel nuestro (env) | Meta Pixel del dealer (DB + plan) |

**Nunca hardcodees el host.** Para el tenant siempre `getTenantPublicUrl()`: si
el dealer cargó dominio propio (`website`) lo usa, si no arma el subdominio.

---

## 0.bis ⚠️ Lo primero: ¿la página es alcanzable sin sesión?

Antes de optimizar nada, verificá que Googlebot pueda ENTRAR. `isPublicRoute` en
[middleware.ts](../../../src/middleware.ts) es un **allowlist**: con
`NEXT_PUBLIC_ENABLE_LOGIN=true`, todo lo que no esté listado pasa por
`auth.protect()` y Clerk devuelve **404 al visitante anónimo** — no un redirect,
un 404. Una página perfecta que devuelve 404 no rankea: no existe.

**Esto ya pasó.** `/precios`, `/blog`, `/terminos`, `/privacidad`, `/robots.txt`
y `/sitemap.xml` devolvían 404 con el login prendido. Se arregló sumándolas al
allowlist.

Dos trampas que no se ven leyendo el código:

1. **`.txt` y `.xml` NO están excluidos del `matcher`** (sí lo están `png`,
   `css`, `js`…). O sea `robots.txt` y `sitemap.xml` **pasan por el middleware**
   y necesitan estar en el allowlist.
2. **No los saques agregando `txt|xml` al matcher.** El robots y el sitemap de
   cada tenant se resuelven con el rewrite de subdominio de ese mismo
   middleware. Sin middleware no hay rewrite, y se caen los sitemaps de TODOS
   los concesionarios.

Comprobalo siempre, no lo asumas:

```bash
for u in precios blog robots.txt sitemap.xml llms.txt; do
  curl -s -o /dev/null -w "/$u -> %{http_code}\n" "http://localhost:3000/$u"
done
```

> En Git Bash, exportá `MSYS_NO_PATHCONV=1` o convierte `/precios` en una ruta
> de Windows y el resultado no significa nada.

---

## 1. Regla de oro: cada página es única (puntos 1 y 2)

Metatítulo y metadescripción **propios por URL**. Nunca reutilizar los de otra
página ni dejar los que hereda el layout.

En marketing eso es un `export const metadata` por page; en el tenant, un
`generateMetadata` que lee el dealership. Ya lo cumplen `precios`, `blog`,
`blog/[slug]`, `terminos` y `privacidad` — copiá ese patrón, no inventes otro.

```ts
// Página estática de marketing
export const metadata: Metadata = {
  title: "Precios y planes",           // el layout le agrega el sufijo de marca
  description: "Comparación de planes…",
  alternates: { canonical: "/precios" },
};
```

---

## 2. Canonical (punto 1, y el gap abierto del repo)

El root layout define `metadataBase: new URL(SITE_URL)`, así que en **marketing**
el canonical puede ser **relativo** y Next lo resuelve solo. Referencia viva:
[blog/[slug]/page.tsx:39](<../../../src/app/(marketing)/blog/[slug]/page.tsx#L39>).

**En el tenant esto NO alcanza y es un bug latente.** `metadataBase` apunta a
`motorflowapp.com`, así que un canonical relativo servido desde
`kansas.motorflowapp.com` resuelve al dominio equivocado y le dice a Google que
el contenido del dealer es nuestro. En el tenant el canonical va **absoluto**:

```ts
// tenant/[slug]/layout.tsx — generateMetadata
const base = getTenantPublicUrl(dealership);
return {
  title, description, icons,
  metadataBase: new URL(base),          // override del root
  alternates: { canonical: base },      // absoluto, no relativo
  openGraph: { /* … */ },
};
```

Hoy [tenant/[slug]/layout.tsx](../../../src/app/tenant/[slug]/layout.tsx) **no
tiene ninguno de los dos**. Está anotado como gap en CLAUDE.md. Si tocás esa
metadata, arreglalo en el mismo cambio.

---

## 3. Intención de búsqueda y arquitectura (puntos 5 y 10)

### Intención (punto 5)
Definí en una frase qué resuelve la página y en qué etapa está quien llega
(informacional: "cómo…", "qué es…" / transaccional: "comprar…", "precio…" /
navegacional: la marca). Título, H1, primer párrafo y CTA responden a ESA
intención. Si no está clara, preguntá antes de escribir — una página que no
matchea la intención no rankea aunque tenga el resto perfecto.

### Interlinkeado y clusters (punto 10)
Pensá la página dentro de un **topic cluster**: una página pilar enlaza a varias
de cluster y cada cluster vuelve al pilar. 2–5 enlaces internos contextuales con
**anchor descriptivo** ("guía de financiación de autos", no "hacé clic acá").

Acá el cluster natural es el **blog** ([data/posts](../../../src/data/)) apuntando
a `/precios` y a la home. En el tenant, la ficha de vehículo debe enlazar al
catálogo y a la home del dealer con `basePath`.

> **Ojo con el `basePath`.** El link a la home del tenant se rompe en subdominio
> si usás `href={basePath}` pelado (`basePath` es `""`). Va `basePath || "/"`.

---

## 4. Estructura y contenido (puntos 3, 4, 6–9, 11, 12)

- **Un solo `<h1>` por página** (punto 3). Ni cero ni dos. Ojo con los
  componentes de sección reusables: si dos secciones del sections-builder traen
  `<h1>`, la página del tenant termina con varios.
- **H1 ≠ metatítulo** (punto 4). El `title` está optimizado para el clic en
  Google (marca, gancho); el H1 es para quien ya entró.
- **Jerarquía H1 → H2 → H3 sin saltos** (punto 9). La leen Google y los lectores
  de pantalla.
- **TL;DR / Puntos clave** (puntos 6 y 7): 3–5 bullets **después** del bloque que
  resuelve la intención, no antes. Es el fragmento que citan buscadores y LLMs.
- **Primer CTA después del primer párrafo** (punto 8), no al final. En marketing
  el destino sale **siempre** de `getPrimaryCta()` de [lib/seo.ts](../../../src/lib/seo.ts)
  — nunca hardcodeado, porque depende de `NEXT_PUBLIC_ENABLE_LOGIN` y ya se
  desincronizó dos veces.
- **Tablas y listas** (punto 11): tabla para lo comparativo (planes, fichas
  técnicas), lista para lo enumerable (pasos, requisitos). Suma legibilidad y
  chances de fragmento destacado.
- **FAQ** (punto 12): 3–8 preguntas reales con respuestas de 1–3 frases.
  Habilita el schema del punto 13.

---

## 5. Imágenes (puntos 14 y 15)

- **Nombre de archivo descriptivo**, con guiones, sin acentos ni espacios:
  `toyota-corolla-2024-frente.webp`, nunca `IMG_2043.jpg`.
- **`alt` en contexto** (SEO + accesibilidad). `alt=""` solo si es decorativa.
- Usar **`next/image`** con `width`/`height` (o `fill` + contenedor) para que
  reserve el espacio y no haga saltar el layout.

> **Las fotos del catálogo las sube el dealer**, así que el nombre de archivo no
> lo controlás: lo genera el uploader hacia el bucket público. Donde sí mandás
> es en el **`alt`**, que se arma con los datos del vehículo:
> `` alt={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`} ``. Un catálogo
> entero con `alt=""` es tráfico de Google Imágenes tirado a la basura.

---

## 6. Datos estructurados (puntos 13 y 16)

**Nunca escribas `<script type="application/ld+json">` a mano.** Existe
[components/seo/json-ld.tsx](../../../src/components/seo/json-ld.tsx): armás un
objeto TS y se lo pasás.

```tsx
const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [...] };
return <JsonLd data={faqLd} />;
```

Ya implementados: **AutoDealer** en la home del tenant (punto 16 ✅),
**Car + Offer** en la ficha de vehículo, **BlogPosting** en las notas, y un
`@graph` en la landing con **Organization + WebSite + SoftwareApplication +
FAQPage** (punto 13 ✅) derivado de `getFaqs()`.

**Cuando un schema ya existe, extendelo — no lo dupliques.** Dos bloques del
mismo `@type` en una página se pisan.

Plantillas y qué campos son obligatorios: `references/schema-jsonld.md`.
**Leé ese archivo** antes de generar cualquier schema.

---

## 7. UX, conversión y móvil (puntos 21 y 22)

- **CTA sticky en móvil** (punto 21). Acá ya está resuelto con el **FAB de
  WhatsApp**: en marketing sale de `SITE_WHATSAPP_URL`; en el tenant, de
  `whatsapp` + `whatsappFabEnabled` + `whatsappMessage` del `Dealership`. No
  agregues una barra sticky nueva sin mirar si se pisa con el FAB.
- **Botón de compartir** (punto 22): share intents nativos y Web Share API en
  móvil (`navigator.share`), nunca scripts de terceros. Requiere `"use client"`.
  Candidata obvia: la ficha de vehículo.

---

## 8. URLs y paginación (puntos 18 y 19)

### URLs limpias (punto 18)
Minúsculas, guiones medios, sin IDs ni conectores (`de`, `la`, `y`, `para`).

Convención del repo: **español en el panel y las rutas del tenant**
(`/vehiculo/…`, `/catalogo`, `/cotizar`), **inglés en los endpoints públicos de
API**. El slug del vehículo es `publicSlug` — respetalo, no armes la URL con el
`id`.

### Paginación (punto 19) — acá difiere del punto original
El punto habla de `/page/N`. **Motorflow no usa eso**: el catálogo pagina con
**query param** `?page=N` ([catalogo/page.tsx:61](../../../src/app/tenant/[slug]/catalogo/page.tsx#L61)),
y lo mismo hacen los listados con filtros. El problema es el mismo (contenido
duplicado y crawl diluido) pero el fix NO es `Disallow: /page/`:

- **Canonical de la página filtrada/paginada → apuntá a la URL limpia**
  (`/catalogo` sin params). Un `Disallow` en robots.txt tampoco sirve: si Google
  no puede rastrear, tampoco puede leer el canonical ni el noindex.
- El sitemap del tenant ya lista **solo** `/`, `/catalogo` y cada vehículo — sin
  combinaciones de filtros. Mantenelo así.

---

## 9. Archivos técnicos (puntos 17, 20, 25)

Detalle y plantillas en `references/archivos-tecnicos.md`. Resumen de qué existe:

| | Marketing | Tenant |
|---|---|---|
| robots (17) | [app/robots.ts](../../../src/app/robots.ts) ✅ | [route handler](../../../src/app/tenant/[slug]/robots.txt/route.ts) ✅ |
| sitemap (25) | [app/sitemap.ts](../../../src/app/sitemap.ts) ✅ | [route handler](../../../src/app/tenant/[slug]/sitemap.xml/route.ts) ✅ |
| llms.txt (20) | [app/llms.txt/route.ts](../../../src/app/llms.txt/route.ts) ✅ | ❌ no existe |

**Por qué el tenant usa route handlers y no la convención `sitemap.ts`:** hay que
resolver el `slug` por `params` y controlar el XML entero. Está documentado en el
propio archivo. No lo "arregles" migrándolo a la convención.

**El robots del tenant respeta `siteEnabled`**: si el sitio no está publicado
devuelve `Disallow: /` total. Toda ruta pública nueva del tenant tiene que
respetar ese gate.

---

## 10. Analítica (puntos 23, 24, 26)

- **Punto 23 (GA4): NO aplica.** En este stack la analítica es **Meta Pixel +
  Conversions API**, no Google Analytics. No instales `gtag` ni GTM sin
  preguntar: son dependencias nuevas, un pixel más y un impacto de performance.
  Todo evento nuevo va por [tracking.md](../../rules/tracking.md).
- **Punto 24 (Search Console):** verificación por DNS, o con
  `verification: { google: "TOKEN" }` en el objeto `Metadata` del root layout
  (no una `<meta>` suelta).
- **Punto 26 (enviar sitemap a GSC):** manual, una vez por dominio. Con
  subdominios por tenant, **cada `{slug}.motorflowapp.com` es una propiedad
  aparte** en Search Console. Escala mal a mano: si algún día se automatiza, va
  por la Search Console API. Hoy, tarea de puesta en marcha por cliente.

---

## Checklist final

| # | Punto | Estado / dónde |
|---|-------|----------------|
| 1 | Metatítulos únicos | `metadata` / `generateMetadata` — sección 1 |
| 2 | Metadescripciones únicas | ídem |
| 3 | Un solo H1 | sección 4 |
| 4 | H1 ≠ metatítulo | sección 4 |
| 5 | Intención definida | sección 3 |
| 6 | TL;DR / Key takeaways | sección 4 |
| 7 | TL;DR después de la intención | sección 4 |
| 8 | CTA tras el primer párrafo | sección 4 · `getPrimaryCta()` |
| 9 | Jerarquía H1→H2→H3 | sección 4 |
| 10 | Interlinkeado y clusters | sección 3 · `[texto](/ruta)` en el body de los posts |
| 11 | Tablas y listas | sección 4 |
| 12 | Sección FAQ | sección 4 |
| 13 | Schema FAQPage | ✅ en la landing, derivado de `getFaqs()` |
| 14 | Nombre de archivo de imagen | sección 5 (limitado en catálogo) |
| 15 | Alt text | sección 5 |
| 16 | Schema LocalBusiness | ✅ `AutoDealer` en la home del tenant |
| 17 | robots.txt | ✅ ambas superficies |
| 18 | URLs limpias | sección 8 |
| 19 | Paginación no indexable | sección 8 — **`?page=`, no `/page/`** |
| 20 | llms.txt | ✅ marketing · ❌ tenant |
| 21 | CTA fijo en móvil | ✅ FAB de WhatsApp |
| 22 | Botón de compartir | sección 7 |
| 23 | GA4 | **N/A** — acá es Meta Pixel + CAPI |
| 24 | Search Console | sección 10 |
| 25 | sitemap.xml | ✅ ambas superficies |
| 26 | Sitemap enviado a GSC | manual, **una propiedad por subdominio** |

Si un punto no aplica, **decilo explícitamente en la entrega** en vez de
omitirlo en silencio.

### Gaps abiertos del repo (arreglalos si tocás esa zona)

1. **`alternates.canonical` ausente en el tenant** → contenido duplicado entre
   `{slug}.motorflowapp.com` y `motorflowapp.com/tenant/{slug}`.
2. **`metadataBase` sin override por tenant** → OG y canonical relativos
   resuelven al dominio de marketing.
3. **`llms.txt` del tenant** — el de marketing ya existe; falta el handler
   bajo `tenant/[slug]/llms.txt/`, gateado por `siteEnabled`.
4. **Sin `BreadcrumbList` en la ficha de vehículo** (Home › Catálogo › Auto).
   Las notas del blog ya lo tienen; la ficha es donde más rinde.
5. **Sin botón de compartir** (punto 22) en la ficha de vehículo.
6. **`SITE_URL` no sanea un path.** [lib/seo.ts](../../../src/lib/seo.ts) solo
   saca la barra final de `NEXT_PUBLIC_APP_URL`. Si esa env trae un path (en
   `.env.local` estaba como `http://localhost:3000/dashboard`), se cuela en el
   `metadataBase` y TODOS los canonical y OG salen con ese prefijo.

### Ya resueltos (no los re-reportes)

- Títulos con marca duplicada en marketing → las pages ya no repiten la marca.
- Canonical heredado del root → `/precios`, `/blog`, `/terminos` y
  `/privacidad` declaran el suyo.
- Marketing y archivos SEO 404 con el login prendido → allowlist del middleware.
