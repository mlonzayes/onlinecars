import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
      // IMPORTANTE: incluir url.search en el rewrite. Sin él, el query string
      // (?sort=...&brand=...&page=...) se PIERDE porque el path absoluto del
      // primer arg de new URL descarta el search del base req.url. Resultado:
      // los filtros/orden del catálogo no funcionaban en los subdominios.
      return NextResponse.rewrite(
        new URL(`/tenant/${subdomain}${url.pathname}${url.search}`, req.url)
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
