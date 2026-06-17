import type { NextConfig } from "next";

// Whitelist dinámico del dominio público de R2/S3 para next/image.
// En local sin S3_PUBLIC_URL no hay patrones — las imágenes vienen de /uploads/...
// servido por Next directo. En prod la env var se setea y el dominio se permite.
function buildRemotePatterns() {
  const patterns: Array<{ protocol: "http" | "https"; hostname: string }> = [];
  const publicUrl = process.env.S3_PUBLIC_URL;
  if (publicUrl) {
    try {
      const u = new URL(publicUrl);
      const protocol = u.protocol.replace(":", "");
      if (protocol === "http" || protocol === "https") {
        patterns.push({ protocol, hostname: u.hostname });
      }
    } catch {
      // env var malformada — silenciar para no romper el build.
    }
  }
  return patterns;
}

// Headers de seguridad aplicados a TODAS las respuestas. Se evitó CSP en este
// pase porque tunearlo bien con Clerk (scripts inline, iframes, eval en dev)
// requiere una iteración aparte con report-only mode.
const securityHeaders = [
  // Bloquea que el browser interprete archivos con MIME distinto al declarado
  // — defensa contra ataques de "MIME confusion" donde un .jpg subido contiene JS.
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Solo permite que el dashboard sea embebido en iframes del mismo origin —
  // anti-clickjacking. SAMEORIGIN en vez de DENY por compatibilidad con widgets
  // de Clerk si en el futuro los hosteamos en subpaths nuestros.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },

  // Mandamos solo el origin como Referer cuando navegamos cross-site, y nada
  // cuando bajamos de https a http. Evita filtrar paths sensibles en logs externos.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Bloquea proactivamente APIs del browser que no usamos. Si en el futuro
  // habilitamos alguna (ej: geolocation para mostrar concesionarios cerca),
  // sacarla de esta lista.
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
    ].join(", "),
  },
];

// HSTS solo en producción — en dev (http://localhost) lo rompe todo porque
// fuerza al browser a recordar que el dominio debe ser HTTPS.
// max-age = 2 años, includeSubDomains para cubrir {slug}.motorflowapp.com,
// preload para entrar al HSTS preload list de los browsers.
if (process.env.NODE_ENV === "production") {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  });
}

const nextConfig: NextConfig = {
  // pdfmake/pdfkit cargan archivos auxiliares (font metrics .afm, datos de
  // PNG/JPEG decoders, etc) con paths relativos a sus __dirname. Si webpack
  // los bundlea, esos paths apuntan a .next/server/vendor-chunks/ donde no
  // existen los archivos → ENOENT al renderizar. Marcándolos como external,
  // Node los resuelve con su `require` regular y mantienen los paths.
  // No hay conflicto de React aquí (pdfmake no usa React), así que externalizar
  // es seguro.
  serverExternalPackages: ["pdfmake", "pdfkit"],
  // Los archivos de public/ NO se incluyen en la función serverless por default,
  // así que fs.readFile(public/logo/...) tira ENOENT en Vercel. Forzamos a Next a
  // trazar el logo de motorflow dentro del lambda de la ruta del PDF.
  outputFileTracingIncludes: {
    "/api/cotizaciones/[id]/pdf": ["./public/logo/motorflow_light.png"],
  },
  images: {
    remotePatterns: buildRemotePatterns(),
    // Cache TTL alto. Sin esto Next re-pide la imagen al upstream cada vez que
    // el cache expira (default 60s). Como Contabo S3 sin CDN es lento, eso
    // mata el sitio: una sola request lenta tira 504. 30 días = una vez que
    // pasó por acá no se vuelve a tocar el upstream. Cuando el dealer
    // reemplaza una foto, sube con un key nuevo → URL nueva → re-fetch.
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 días
    // Calidades permitidas (Next 15.5 las exige declaradas). 90 para los
    // screenshots de UI, que con el 75 default quedan con el texto borroso.
    qualities: [75, 90],
    // Solo WebP (no AVIF). AVIF consume mucho CPU en serverless y muchos
    // browsers viejos no lo soportan — termina haciendo doble decode.
    formats: ["image/webp"],
    // Set acotado de tamaños generados. Por default Next genera ~10 widths
    // distintos por imagen — cada uno pega al upstream. Esto es overkill
    // para nuestro catálogo (cards de 2-3 cols, detail full-bleed).
    deviceSizes: [640, 828, 1080, 1920],
    imageSizes: [64, 128, 256, 384],
  },
  async headers() {
    return [
      {
        // Aplica a todas las rutas — la regla universal de Next es :path*.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
