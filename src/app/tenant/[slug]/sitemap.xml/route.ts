import { getDealershipBySlug, getPublishedVehicles, getTenantPublicUrl } from "@/lib/tenant";

// Sitemap por tenant. Se sirve en {slug}.motorflowapp.com/sitemap.xml (el
// middleware reescribe a /tenant/{slug}/sitemap.xml). Lista home + catálogo +
// cada vehículo publicado, así Google/IA descubren los autos uno por uno.
// Route handler (no la convención sitemap.ts) para resolver el slug por params
// y tener control total del XML.

interface RouteParams {
  params: Promise<{ slug: string }>;
}

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params;

  // getDealershipBySlug ya gatea active + siteEnabled → null si el sitio no está
  // publicado, en cuyo caso no devolvemos sitemap.
  const dealership = await getDealershipBySlug(slug);
  if (!dealership) {
    return new Response("Not found", { status: 404 });
  }

  const base = getTenantPublicUrl(dealership);
  const vehicles = await getPublishedVehicles(dealership.id);

  const entries: { loc: string; lastmod?: string; priority: string }[] = [
    { loc: `${base}/`, priority: "1.0" },
    { loc: `${base}/catalogo`, priority: "0.8" },
    ...vehicles.map((v) => ({
      loc: `${base}/vehiculo/${v.publicSlug}`,
      lastmod: v.updatedAt.toISOString(),
      priority: "0.7",
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) =>
      `  <url><loc>${xmlEscape(e.loc)}</loc>${
        e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""
      }<priority>${e.priority}</priority></url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
