import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding(.*)",
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
