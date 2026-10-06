import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getTenantPathPrefix, isTenantSubdomainRouting } from "@/lib/tenant-routing";

// OJO: esto es un ALLOWLIST. Con NEXT_PUBLIC_ENABLE_LOGIN=true, todo lo que no
// esté acá pasa por auth.protect(), y Clerk responde 404 al visitante anónimo
// (no un redirect). Para el dashboard es lo que queremos; para una página de
// MARKETING significa que Googlebot y cualquier prospecto sin sesión ven un 404.
//
// ⚠️ Página de marketing nueva → sumala acá Y al sitemap, o desaparece del
// sitio en cuanto se prenda el login. La home sola no alcanza: /precios es la
// página de mayor intención comercial que tenemos.
const isPublicRoute = createRouteMatcher([
  "/",
  // Marketing público (route group `(marketing)`)
  "/precios",
  "/blog(.*)",
  "/terminos",
  "/privacidad",
  // Auth y alta
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding(.*)",
  // Archivos de SEO del dominio principal. El matcher de abajo excluye por
  // extensión (png, css, js…) pero NO .txt ni .xml, así que estos SÍ pasan por
  // acá y sin la excepción devuelven 404: Googlebot se queda sin sitemap.
  //
  // No los saques agregando `txt|xml` al matcher: el robots.txt y el
  // sitemap.xml de CADA tenant se resuelven con el rewrite de subdominio de
  // este mismo middleware. Si el middleware no corre, no hay rewrite y se caen
  // los sitemaps de todos los concesionarios.
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  // Sitios de los concesionarios + endpoints sin sesión
  "/tenant(.*)",
  "/api/public/(.*)",
  "/api/webhooks/(.*)",
  // MCP: la auth la hace el handler con el token OAuth (Bearer), no la sesión.
  // Con auth.protect() acá, Clerk respondería 404 y el cliente nunca recibiría
  // el 401 con WWW-Authenticate que arranca el login.
  "/api/mcp",
  "/.well-known/oauth-protected-resource(.*)",
  "/.well-known/oauth-authorization-server",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const url = req.nextUrl;
  // Saco el puerto del host (ej: "foo.com.ar:3000" → "foo.com.ar") para que
  // matchee bien contra appDomain.
  const hostname = (req.headers.get("host") ?? "").split(":")[0];
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "motorflowapp.com";
  const isLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_LOGIN === "true";

  // Solo aplicamos subdomain routing si el hostname pertenece a NUESTRO dominio.
  // Cualquier otro host (vercel.app previews, localhost, IPs) se trata como
  // dominio principal y no se reescribe. Esto evita bugs donde "onlinecars.vercel.app"
  // se interpretaba como subdomain → rewrite a /tenant/onlinecars.vercel.app → 404.
  if (hostname.endsWith(`.${appDomain}`)) {
    const subdomain = hostname.slice(0, -1 * (appDomain.length + 1));
    if (subdomain && subdomain !== "app" && subdomain !== "www") {
      // Red de seguridad: un link armado con el prefijo de path
      // ({slug}.motorflowapp.com/tenant/{slug}/catalogo) se reescribiría a
      // /tenant/{slug}/tenant/{slug}/catalogo → 404. Lo mandamos a la URL limpia.
      const prefix = getTenantPathPrefix(subdomain);
      if (url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)) {
        const clean = url.pathname.slice(prefix.length) || "/";
        return NextResponse.redirect(new URL(`${clean}${url.search}`, req.url), 308);
      }

      // IMPORTANTE: incluir url.search en el rewrite. Sin él, el query string
      // (?sort=...&brand=...&page=...) se PIERDE porque el path absoluto del
      // primer arg de new URL descarta el search del base req.url. Resultado:
      // los filtros/orden del catálogo no funcionaban en los subdominios.
      return NextResponse.rewrite(
        new URL(`/tenant/${subdomain}${url.pathname}${url.search}`, req.url)
      );
    }
  }

  // En producción el sitio del tenant vive SOLO en su subdominio. El acceso por
  // path (motorflowapp.com/tenant/{slug}/...) redirige allá: es contenido
  // duplicado para Google, y además las páginas del tenant arman los links sin
  // prefijo (ver getTenantBasePath), así que por path quedarían rotos.
  if (isTenantSubdomainRouting()) {
    const match = url.pathname.match(/^\/tenant\/([a-z0-9-]+)(\/.*)?$/);
    if (match) {
      const [, slug, rest = "/"] = match;
      return NextResponse.redirect(
        new URL(`${rest}${url.search}`, `https://${slug}.${appDomain}`),
        308
      );
    }
  }

  // Proteger rutas del dashboard solo si login está habilitado
  if (isLoginEnabled && !isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
