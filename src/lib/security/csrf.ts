import { NextResponse, type NextRequest } from "next/server";
import { generateRequestId, logger } from "@/lib/logger";
import { isSameOriginRequest } from "./same-origin";

// CSRF para TODA la API del panel, desde el middleware. Los endpoints que mutan
// se autentican con la cookie de sesión de Clerk, y los sitios de los tenants
// ({slug}.motorflowapp.com) son same-site con el panel: SameSite=Lax no frena un
// POST armado desde ahí. Ver same-origin.ts.
//
// Falla cerrado: un endpoint nuevo que muta queda protegido sin hacer nada. Si
// lo llama un tercero (webhook, servidor, sitio del tenant), va en EXEMPT_PREFIXES.

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Endpoints que reciben POST de otro origen a propósito. Ninguno usa la cookie
// de sesión para autorizar.
const EXEMPT_PREFIXES = [
  "/api/public/", // sitio del tenant y landing: rate limit + honeypot
  "/api/webhooks/", // Clerk: firma svix
  "/api/mercadolibre/webhooks", // ML: secreto propio
  "/api/cron/", // Vercel Cron: CRON_SECRET
  "/api/mcp", // Claude/ChatGPT: token OAuth Bearer
] as const;

export function requiresOriginCheck(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/api/")) return false;
  if (SAFE_METHODS.has(request.method)) return false;
  return !EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isTrustedOrigin(request: NextRequest): boolean {
  if (isSameOriginRequest(request)) return true;
  // Sin Origin (algún browser viejo en same-origin): Sec-Fetch-Site lo pone el
  // browser y una página no lo puede falsificar.
  return !request.headers.get("origin") && request.headers.get("sec-fetch-site") === "same-origin";
}

/** 403 si el request necesita chequeo y no viene del panel; null si pasa. */
export function rejectCrossOriginApiRequest(request: NextRequest): NextResponse | null {
  if (!requiresOriginCheck(request) || isTrustedOrigin(request)) return null;

  logger.warn(request.headers.get("x-request-id") ?? generateRequestId(), "security.csrf.rejected", {
    method: request.method,
    path: request.nextUrl.pathname,
    origin: request.headers.get("origin"),
    secFetchSite: request.headers.get("sec-fetch-site"),
  });
  return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
}
