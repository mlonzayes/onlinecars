# Archivos técnicos del sitio — motorflow

En Next.js App Router estos archivos **no se escriben a mano en `public/`**: los
genera el framework. Dos formas, y en este repo conviven las dos a propósito.

| Forma | Cuándo | Ejemplo en el repo |
|---|---|---|
| Convención `MetadataRoute` | ruta fija, sin params dinámicos | [app/robots.ts](../../../src/app/robots.ts) · [app/sitemap.ts](../../../src/app/sitemap.ts) |
| Route handler (`route.ts`) | hace falta resolver `params` o controlar el body | [tenant/[slug]/robots.txt](../../../src/app/tenant/[slug]/robots.txt/route.ts) · [tenant/[slug]/sitemap.xml](../../../src/app/tenant/[slug]/sitemap.xml/route.ts) |

> **No migres el tenant a la convención.** Necesita el `slug` por `params` y el
> control del XML entero. Está documentado en el propio archivo.

---

## robots (punto 17) — ambas superficies ✅

### Marketing
[app/robots.ts](../../../src/app/robots.ts) devuelve un `MetadataRoute.Robots`:
permite `/`, bloquea `/dashboard`, `/api`, `/sign-in`, `/sign-up`, `/onboarding`,
`/aceptar-terminos`, `/vista-previa`, y declara `sitemap` + `host` con `SITE_URL`.

**Ruta privada nueva → agregala al `disallow`.** Y `/vista-previa` está
bloqueada por algo: es el sitio del dealer sin publicar.

### Tenant
El handler respeta `siteEnabled`: si `getDealershipBySlug` devuelve `null`
(inactivo o despublicado), responde `Disallow: /` total. Si está publicado,
`Allow: /` + `Sitemap: {base}/sitemap.xml`.

**Nunca bloquees CSS ni JS** — Google necesita renderizar. Y `Disallow` **no
desindexa** lo que ya está en el índice: para sacar una URL usá `robots:
{ index: false, follow: true }` en su `Metadata`, y **no** la bloquees en robots
a la vez, porque entonces el bot no puede leer el noindex.

---

## sitemap (punto 25) — ambas superficies ✅

### Marketing
[app/sitemap.ts](../../../src/app/sitemap.ts): rutas estáticas (`/`, `/precios`,
`/blog`, `/terminos`, `/privacidad`) + un entry por post de `getAllPosts()`.
**Página de marketing nueva → sumala acá**, o no se descubre.

### Tenant
Lista `/`, `/catalogo` y **cada vehículo publicado** con `lastmod` de
`updatedAt`. Cacheado 1h (`s-maxage=3600`).

Solo **URLs indexables**: nada de `noindex` ni combinaciones de filtros. Si
mañana se suma una ruta pública al tenant (ej. `/opinion`), va acá también.

Si algún día el sitemap de un tenant pasa de 50.000 URLs, se parte en un
**sitemap index**. Hoy no aplica ni de cerca.

---

## llms.txt (punto 20) — ❌ no existe en ninguna de las dos

Markdown (no XML) para que los modelos de IA entiendan y citen el sitio. Con
buscadores que responden sin clic, es el equivalente del sitemap para LLMs.

**Marketing** → route handler en `src/app/llms.txt/route.ts`:

```ts
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";
import { getAllPosts } from "@/data/posts";

export function GET() {
  const posts = getAllPosts()
    .map((p) => `- [${p.title}](${SITE_URL}/blog/${p.slug}): ${p.excerpt}`)
    .join("\n");

  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

## Páginas principales
- [Inicio](${SITE_URL}/): qué es y para quién.
- [Precios](${SITE_URL}/precios): planes y qué incluye cada uno.

## Blog
${posts}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
```

**Tenant** → mismo patrón que su `robots.txt`: handler bajo
`tenant/[slug]/llms.txt/`, gateado por `siteEnabled`, con el dealer, su catálogo
y los datos de contacto. El middleware ya rutea el subdominio.

`Content-Type: text/plain` (no `text/markdown`) para que se lea en el browser.

---

## Analítica (punto 23) — GA4 NO aplica

En este stack la analítica es **Meta Pixel + Conversions API**, no Google
Analytics. No agregues `gtag` ni GTM sin preguntar: dependencia nueva, pixel de
más y costo de performance en el hilo principal.

- **Web principal** → pixel montado UNA vez en `(marketing)/layout.tsx`, desde
  `NEXT_PUBLIC_META_PIXEL_ID`.
- **Tenant** → pixel del dealer, desde la DB y gateado por plan.

Todo evento nuevo va por [tracking.md](../../rules/tracking.md), sin excepción.

---

## Search Console (puntos 24 y 26) — manual

**Verificar propiedad (24):** por DNS (recomendado), o con el objeto `Metadata`
del root layout — nunca una `<meta>` suelta en el JSX:

```ts
export const metadata: Metadata = {
  verification: { google: "TU_TOKEN" },
};
```

**Enviar el sitemap (26):** GSC → *Sitemaps* → pegar la URL y enviar.

> **El costo escondido del multi-tenant:** cada `{slug}.motorflowapp.com` es una
> **propiedad separada** en Search Console. Con 5 clientes se hace a mano; con
> 50 no. Si se vuelve un problema, se automatiza con la Search Console API en el
> alta del tenant. Hoy es tarea de puesta en marcha por cliente — y conviene
> dejarlo dicho en el onboarding en vez de descubrirlo con 30 dealers adentro.
