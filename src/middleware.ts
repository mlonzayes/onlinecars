import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding(.*)",
  "/api/public/(.*)",
  "/api/webhooks/(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") ?? "";
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "onlinecars.com.ar";

  // En localhost no aplica subdomain routing
  const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1");

  if (!isLocalhost) {
    // Detectar subdominio solo en producción/staging
    const subdomain = hostname.replace(`.${appDomain}`, "").replace(appDomain, "");

    // Si hay subdominio y no es "app" ni "www", es un sitio de concesionario
    if (subdomain && subdomain !== "app" && subdomain !== "www") {
      return NextResponse.rewrite(
        new URL(`/tenant/${subdomain}${url.pathname}`, req.url)
      );
    }
  }

  // Proteger rutas del dashboard
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
