/**
 * Routing del sitio público del tenant. Sin dependencias (ni Prisma ni Redis)
 * a propósito: lo importa también el middleware, que corre en el edge.
 */

/**
 * ¿Los sitios de los tenants se sirven por subdominio (`{slug}.motorflowapp.com`)?
 *
 * Solo en el deploy de PRODUCCIÓN. En localhost y en los previews de Vercel
 * (`*.vercel.app`) no hay subdominios por tenant y se navega por path
 * (`/tenant/{slug}/...`).
 *
 * Se decide por entorno y NO por el header `host` a propósito: leer `headers()`
 * vuelve dinámica la página y la saca del cache de Vercel (ISR). Era la razón
 * por la que cada visita al sitio de un concesionario renderizaba de cero.
 * Para que esto alcance, el middleware manda en producción todo acceso por
 * path al subdominio, así el sitio nunca se sirve de las dos formas.
 */
export function isTenantSubdomainRouting(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export function getTenantPathPrefix(slug: string): string {
  return `/tenant/${slug}`;
}

/**
 * `basePath` de los links internos del sitio del tenant:
 *
 * - Producción (subdominio): "" → `/catalogo`, `/cotizar`...
 * - Local / preview: `/tenant/{slug}` → `/tenant/{slug}/catalogo`...
 */
export function getTenantBasePath(slug: string): string {
  return isTenantSubdomainRouting() ? "" : getTenantPathPrefix(slug);
}

/**
 * Tag de `unstable_cache` de los datos del sitio público de un tenant
 * (dealership, catálogo). Lo invalida invalidateTenantHomeBundle().
 */
export function tenantSiteTag(slug: string): string {
  return `tenant-site:${slug}`;
}
