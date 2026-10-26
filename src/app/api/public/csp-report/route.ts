/**
 * POST /api/public/csp-report
 *
 * Recibe las violaciones de Content-Security-Policy que manda el browser (ver
 * src/lib/security/csp.ts) y las loggea como `security.csp.violation`. No
 * persiste nada: el análisis se hace sobre los logs de Vercel.
 *
 * Llegan en dos formatos según el browser:
 *  - report-uri (application/csp-report):
 *      { "csp-report": { "document-uri": "...", "effective-directive": "script-src",
 *                        "blocked-uri": "https://evil.com/x.js", ... } }
 *  - Reporting API (application/reports+json):
 *      [{ "type": "csp-violation", "body": { "documentURL": "...",
 *         "effectiveDirective": "script-src", "blockedURL": "...", ... } }]
 *
 * Respuesta: 204 siempre (el browser la ignora).
 */
import { z } from "zod";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { applyRateLimit, cspReportLimiter, getClientIp } from "@/lib/rate-limit";
import { isHoneypotTriggered } from "@/lib/honeypot";

// Un reporte pesa ~1 KB; más que esto es basura o abuso.
const MAX_BODY_BYTES = 16 * 1024;

// Ruido que no depende de nuestro código: extensiones del browser inyectando cosas.
const IGNORED_SOURCE = /^(chrome|moz|safari(-web)?|ms-browser)-extension:/;

const legacyReportSchema = z.object({
  "csp-report": z.object({
    "document-uri": z.string().optional(),
    "effective-directive": z.string().optional(),
    "violated-directive": z.string().optional(),
    "blocked-uri": z.string().optional(),
    "source-file": z.string().optional(),
    disposition: z.string().optional(),
  }),
});

const reportingApiSchema = z.array(
  z.object({
    type: z.string(),
    body: z.object({
      documentURL: z.string().optional(),
      effectiveDirective: z.string().optional(),
      blockedURL: z.string().optional(),
      sourceFile: z.string().optional(),
      disposition: z.string().optional(),
    }),
  })
);

interface CspViolation {
  documentUri?: string;
  directive?: string;
  blockedUri?: string;
  sourceFile?: string;
  disposition?: string;
}

function parseViolations(body: unknown): CspViolation[] {
  const legacy = legacyReportSchema.safeParse(body);
  if (legacy.success) {
    const r = legacy.data["csp-report"];
    return [{
      documentUri: r["document-uri"],
      directive: r["effective-directive"] ?? r["violated-directive"],
      blockedUri: r["blocked-uri"],
      sourceFile: r["source-file"],
      disposition: r.disposition,
    }];
  }
  const modern = reportingApiSchema.safeParse(body);
  if (modern.success) {
    return modern.data
      .filter((r) => r.type === "csp-violation")
      .map(({ body: b }) => ({
        documentUri: b.documentURL,
        directive: b.effectiveDirective,
        blockedUri: b.blockedURL,
        sourceFile: b.sourceFile,
        disposition: b.disposition,
      }));
  }
  return [];
}

// Sin query string ni hash: pueden traer tokens, filtros o PII.
function stripQuery(value: string | undefined): string | undefined {
  return value?.split(/[?#]/)[0];
}

export const POST = withLogger(async (request, { requestId }) => {
  const noContent = (headers?: Record<string, string>) => new Response(null, { status: 204, headers });

  const ip = getClientIp(request);
  const rl = await applyRateLimit(cspReportLimiter, ip, requestId);
  if (!rl.ok) return new Response(null, { status: 429, headers: rl.headers });

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return noContent(rl.headers);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return noContent(rl.headers);
  }

  // Convención de /api/public/*. El browser nunca manda este campo; si llega,
  // es alguien posteando a mano.
  if (isHoneypotTriggered(body)) {
    logger.warn(requestId, "security.csp.honeypot_triggered", {});
    return noContent(rl.headers);
  }

  for (const v of parseViolations(body)) {
    if (v.blockedUri && IGNORED_SOURCE.test(v.blockedUri)) continue;
    if (v.sourceFile && IGNORED_SOURCE.test(v.sourceFile)) continue;
    logger.warn(requestId, "security.csp.violation", {
      directive: v.directive,
      blockedUri: stripQuery(v.blockedUri),
      documentUri: stripQuery(v.documentUri),
      sourceFile: stripQuery(v.sourceFile),
      disposition: v.disposition,
    });
  }

  return noContent(rl.headers);
});
