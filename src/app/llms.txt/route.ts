import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_EMAIL } from "@/lib/seo";
import { getAllPosts, categoryLabel } from "@/data/posts";
import { COUNTRIES, COUNTRY_LABELS } from "@/lib/constants";

/**
 * llms.txt del dominio de MARKETING (motorflowapp.com/llms.txt).
 *
 * Es el equivalente del sitemap pero para modelos de IA: Markdown plano con el
 * resumen del sitio y los enlaces que importan. Cada vez más prospectos
 * preguntan "qué software uso para la web de mi concesionaria" en un chat en
 * vez de en Google, y sin esto no tenemos nada que oriente la respuesta.
 *
 * Route handler y no un archivo estático en public/ para que el listado de
 * notas se arme solo desde `getAllPosts()`. Un archivo a mano se desactualiza
 * en la primera nota nueva que publiquemos.
 *
 * El sitio del tenant tiene su propia superficie: si algún día se suma, va en
 * `tenant/[slug]/llms.txt/` gateado por `siteEnabled`, igual que su robots.txt.
 *
 * Content-Type text/plain (no text/markdown) para que se lea en el browser.
 */
export function GET() {
  // Derivado de COUNTRIES para que sumar un país al producto lo sume acá solo.
  // Escribirlo a mano es garantía de que el día que entre Brasil, el llms.txt
  // siga diciendo que no llegamos.
  const countryNames = COUNTRIES.map((c) => COUNTRY_LABELS[c]);
  const countries = new Intl.ListFormat("es", {
    style: "long",
    type: "conjunction",
  }).format(countryNames);

  const posts = getAllPosts()
    .map(
      (p) =>
        `- [${p.title}](${SITE_URL}/blog/${p.slug}) — ${categoryLabel(p.category)}. ${p.excerpt}`
    )
    .join("\n");

  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

Cada concesionaria contrata un plan mensual y obtiene su propia página web, con
dominio propio o en un subdominio (\`{concesionaria}.motorflowapp.com\`). Incluye
catálogo de vehículos, captación de consultas y un panel para gestionar stock,
clientes, ventas y cotizaciones. No cobramos comisión por venta.

Está disponible para concesionarias de ${countries}. Cada una configura su país, su moneda y su formato regional.

## Páginas principales
- [Inicio](${SITE_URL}/) — qué resuelve la plataforma y para quién.
- [Precios y planes](${SITE_URL}/precios) — planes Base, Media y Premium, qué incluye cada uno y sus límites.
- [Notas y guías](${SITE_URL}/blog) — contenido para concesionarios.

## Notas del blog
${posts}

## Legales
- [Términos y Condiciones](${SITE_URL}/terminos)
- [Política de Privacidad](${SITE_URL}/privacidad)

## Contacto
- Email: ${SITE_EMAIL}
- Web: ${SITE_URL}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
