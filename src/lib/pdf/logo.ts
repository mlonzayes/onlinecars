import { promises as fs } from "node:fs";
import path from "node:path";

export interface QuotationLogo {
  dataUri: string;
  isMotorflow: boolean;
}

const MOTORFLOW_LOGO_PATH = ["public", "logo", "motorflow_light.png"] as const;

/**
 * Resuelve el logo a embeber en el PDF de la cotización como data URI base64.
 *
 * Reglas:
 * - plan "base" → logo motorflow.
 * - plan "media"|"premium"|"enterprise" CON logo subido en formato soportado
 *   (PNG o JPEG) → logo del dealer.
 * - cualquier otro caso (WebP, formato desconocido, fetch falla) → fallback a
 *   motorflow.
 *
 * pdfkit (base de pdfmake) solo soporta PNG y JPEG. Si el dealer subió WebP,
 * el PDF rompería al embedearlo, así que detectamos magic bytes y caemos al
 * fallback antes de pasárselo a pdfmake.
 */
export async function resolveQuotationLogo(
  dealership: { plan: string; logo: string | null },
  appOrigin: string
): Promise<QuotationLogo> {
  const planUnlocked = dealership.plan !== "base";

  if (planUnlocked && dealership.logo) {
    try {
      const buffer = await loadImageBuffer(dealership.logo, appOrigin);
      const mime = detectImageMime(buffer);
      if (mime === "image/png" || mime === "image/jpeg") {
        return {
          dataUri: `data:${mime};base64,${buffer.toString("base64")}`,
          isMotorflow: false,
        };
      }
    } catch {
      // ignoramos y caemos al fallback
    }
  }

  return readMotorflowLogo();
}

/**
 * Resuelve el logo del dealer para mostrarlo en el strip de datos (al costado
 * del nombre/dirección). Independiente del plan: si el dealer subió un logo
 * en formato soportado, lo devolvemos; si no, null y el strip queda sin logo.
 *
 * El header del PDF puede mostrar el logo de motorflow al mismo tiempo —
 * esta función es para el bloque secundario de "datos del concesionario".
 */
export async function resolveDealerLogo(
  dealership: { logo: string | null },
  appOrigin: string
): Promise<{ dataUri: string } | null> {
  if (!dealership.logo) return null;

  try {
    const buffer = await loadImageBuffer(dealership.logo, appOrigin);
    const mime = detectImageMime(buffer);
    if (mime === "image/png" || mime === "image/jpeg") {
      return {
        dataUri: `data:${mime};base64,${buffer.toString("base64")}`,
      };
    }
  } catch {
    // Si falla fetch o el formato no es soportado, devolvemos null y el PDF
    // se renderiza sin logo del dealer (los datos siguen apareciendo).
  }
  return null;
}

async function readMotorflowLogo(): Promise<QuotationLogo> {
  const filePath = path.join(process.cwd(), ...MOTORFLOW_LOGO_PATH);
  const buffer = await fs.readFile(filePath);
  return {
    dataUri: `data:image/png;base64,${buffer.toString("base64")}`,
    isMotorflow: true,
  };
}

async function loadImageBuffer(
  url: string,
  appOrigin: string
): Promise<Buffer> {
  const fullUrl = url.startsWith("http") ? url : `${appOrigin}${url}`;
  const res = await fetch(fullUrl);
  if (!res.ok) throw new Error(`Failed to fetch logo: ${res.status}`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (
    buffer[0] === 0x89 &&
    buffer.subarray(1, 4).toString("ascii") === "PNG"
  ) {
    return "image/png";
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  return null;
}
