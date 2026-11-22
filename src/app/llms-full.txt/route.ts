import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";
import { getAllPosts } from "@/lib/blog-posts";
import { postToMarkdown } from "@/lib/blog";

/**
 * llms-full.txt del dominio de MARKETING: el texto completo de cada nota del
 * blog en Markdown. El llms.txt es el índice; este es el contenido.
 *
 * Por qué existe: un motor de IA que tiene que elegir qué citar lee mejor texto
 * con estructura (títulos, listas, links absolutos) que el HTML de la página,
 * con navbar, footer y scripts de por medio. Se arma desde `getAllPosts()`, así
 * que una nota nueva aparece sola.
 *
 * Solo marketing: en el subdominio de un tenant esta ruta cae en el rewrite a
 * /tenant/{slug}/llms-full.txt, que no existe (404). Es lo que queremos.
 *
 * Request: GET /llms-full.txt
 * Response 200 (text/plain):
 *   # MotorFlow — notas del blog
 *   > MotorFlow es el sistema para concesionarias…
 *   ## Cómo aumentar las consultas a tu concesionario en 30 días
 *   URL: https://motorflowapp.com/blog/aumentar-consultas-concesionario
 *   …
 */
export async function GET() {
  const posts = (await getAllPosts()).map(postToMarkdown).join("\n\n---\n\n");

  const body = `# ${SITE_NAME}: notas del blog

> ${SITE_DESCRIPTION}

Texto completo de las notas publicadas en ${SITE_URL}/blog, de la más nueva a la más vieja. Índice del sitio: ${SITE_URL}/llms.txt

${posts}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
