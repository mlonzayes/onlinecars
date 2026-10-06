import { getDealershipBySlug, getTenantPublicUrl } from "@/lib/tenant";
import { AI_TRAINING_CRAWLERS } from "@/lib/seo";

// robots.txt por tenant. Se sirve en {slug}.motorflowapp.com/robots.txt.
// Si el sitio está publicado: permite indexar y apunta a su sitemap.
// Si no (siteEnabled false / no existe): noindex total.

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params;
  const dealership = await getDealershipBySlug(slug);

  if (!dealership) {
    // Sitio no publicado → que no lo indexen.
    return new Response("User-agent: *\nDisallow: /\n", {
      headers: { "Content-Type": "text/plain" },
    });
  }

  const base = getTenantPublicUrl(dealership);
  // Crawlers de entrenamiento de IA bloqueados (ver AI_TRAINING_CRAWLERS).
  const aiBlock = AI_TRAINING_CRAWLERS.map((ua) => `User-agent: ${ua}`).join("\n");
  const body = `User-agent: *\nAllow: /\n\n${aiBlock}\nDisallow: /\n\nSitemap: ${base}/sitemap.xml\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
