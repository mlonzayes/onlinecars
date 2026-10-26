// Content-Security-Policy. Se importa desde next.config.ts, así que acá NO van
// alias `@/` ni nada que dependa del runtime de Next: solo env vars y strings.
//
// Fase actual: REPORT-ONLY. El browser no bloquea nada, solo reporta a
// /api/public/csp-report lo que habría bloqueado. Cuando los logs
// (`security.csp.violation`) queden limpios unos días, se pasa a enforcing
// cambiando CSP_MODE. Ver la sección CSP de CLAUDE.md.

type CspMode = "report-only" | "enforce";
export const CSP_MODE: CspMode = "report-only";

export const CSP_REPORT_PATH = "/api/public/csp-report";

// Grupo del Reporting API (header Reporting-Endpoints + directiva report-to).
const REPORT_GROUP = "csp";

type Directives = Record<string, string[]>;

// Origen (scheme://host) de una URL de env, o null si falta o está mal formada.
function originOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

// El Frontend API de Clerk viene codificado en la publishable key:
// pk_live_<base64("clerk.motorflowapp.com$")>. Así no hace falta otra env var
// y dev (*.clerk.accounts.dev) y prod quedan cubiertos con la misma lógica.
export function clerkFrontendApiOrigin(publishableKey: string | undefined): string | null {
  const encoded = publishableKey?.split("_")[2];
  if (!encoded) return null;
  try {
    const host = Buffer.from(encoded, "base64").toString("utf8").replace(/\$$/, "");
    return /^[a-z0-9.-]+$/i.test(host) ? `https://${host}` : null;
  } catch {
    return null;
  }
}

// URL absoluta del endpoint de reportes. Absoluta a propósito: en un subdominio
// de tenant, un path relativo cae en el rewrite del middleware
// (/tenant/{slug}/api/...) y da 404.
export function cspReportUrl(): string {
  const appOrigin = originOf(process.env.NEXT_PUBLIC_APP_URL);
  return appOrigin ? `${appOrigin}${CSP_REPORT_PATH}` : CSP_REPORT_PATH;
}

function buildDirectives(isDev: boolean): Directives {
  const clerk = clerkFrontendApiOrigin(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  // Bucket público (fotos/videos del catálogo) y endpoint S3 (uploads y
  // descargas con presigned URL, path-style).
  const storage = [
    ...new Set([originOf(process.env.S3_PUBLIC_URL), originOf(process.env.S3_ENDPOINT)]),
  ].filter((o): o is string => o !== null);
  const clerkOrigins = clerk ? [clerk] : [];

  // Turnstile: el captcha del sign-up de Clerk.
  const turnstile = "https://challenges.cloudflare.com";
  // Pixel de la web principal y el del dealer usan los mismos dominios.
  const meta = ["https://connect.facebook.net", "https://www.facebook.com"];
  const clarity = ["https://www.clarity.ms", "https://*.clarity.ms", "https://c.bing.com"];

  return {
    "default-src": ["'self'"],
    // 'unsafe-inline' por ahora: Next mete scripts inline de hidratación y
    // los snippets de Meta/Clarity también son inline. Sacarlo exige nonces,
    // que vuelven dinámicas las páginas y rompen el ISR del tenant.
    // 'unsafe-eval' solo en dev (React Refresh / webpack lo usan).
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      ...clerkOrigins,
      turnstile,
      "https://connect.facebook.net",
      "https://www.clarity.ms",
      "https://*.clarity.ms",
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https://img.clerk.com", ...meta, ...clarity, ...storage],
    "media-src": ["'self'", "blob:", ...storage],
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      ...clerkOrigins,
      "https://clerk-telemetry.com",
      turnstile,
      ...meta,
      ...clarity,
      ...storage,
      ...(isDev ? ["ws:"] : []),
    ],
    "frame-src": [
      "'self'",
      turnstile,
      // Mapa del concesionario (embed keyless) y planes de financiación en YouTube.
      "https://maps.google.com",
      "https://www.google.com",
      "https://www.openstreetmap.org",
      "https://www.youtube.com",
      "https://www.youtube-nocookie.com",
      // El pixel de Meta abre un iframe oculto y le postea un form a /tr.
      "https://www.facebook.com",
    ],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'", "https://www.facebook.com"],
    "frame-ancestors": ["'self'"],
    "report-uri": [cspReportUrl()],
    "report-to": [REPORT_GROUP],
  };
}

export function buildCspHeaders(isDev: boolean): Array<{ key: string; value: string }> {
  const policy = Object.entries(buildDirectives(isDev))
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");

  const headers = [
    {
      key: CSP_MODE === "enforce" ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only",
      value: policy,
    },
  ];

  // Reporting-Endpoints exige URL absoluta: sin NEXT_PUBLIC_APP_URL queda solo
  // report-uri (que acepta relativa y lo siguen entendiendo todos los browsers).
  const reportUrl = cspReportUrl();
  if (reportUrl.startsWith("http")) {
    headers.push({ key: "Reporting-Endpoints", value: `${REPORT_GROUP}="${reportUrl}"` });
  }

  return headers;
}
