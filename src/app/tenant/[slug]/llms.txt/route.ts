import {
  getDealershipBySlug,
  getPublishedVehicles,
  getTenantPublicUrl,
} from "@/lib/tenant";
import { COUNTRY_LABELS } from "@/lib/constants";

/**
 * llms.txt POR TENANT. Se sirve en {slug}.motorflowapp.com/llms.txt (el
 * middleware reescribe a /tenant/{slug}/llms.txt, igual que el robots.txt).
 *
 * Cada vez más compradores preguntan "concesionarias de usados en {ciudad}" en
 * un chat de IA en vez de en Google. Esto le da al modelo el listado real de la
 * concesionaria con precios, en vez de dejarlo adivinar desde el HTML.
 *
 * Route handler (no la convención de archivo) para resolver el slug por params
 * y gatear por `siteEnabled`, mismo criterio que robots.txt y sitemap.xml.
 */
interface RouteParams {
  params: Promise<{ slug: string }>;
}

function formatPrice(price: unknown, currency: string): string {
  const num = typeof price === "string" ? parseFloat(price) : Number(price);
  if (isNaN(num)) return "Consultar";
  return `${currency} ${num.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params;

  // getDealershipBySlug ya gatea active + siteEnabled → null si no está
  // publicado. Un sitio despublicado no expone su stock a los modelos.
  const dealership = await getDealershipBySlug(slug);
  if (!dealership) {
    return new Response("Not found", { status: 404 });
  }

  const base = getTenantPublicUrl(dealership);
  const vehicles = await getPublishedVehicles(dealership.id);

  const location = [dealership.city, dealership.province]
    .filter(Boolean)
    .join(", ");

  const stock = vehicles
    .map(
      (v) =>
        `- [${v.title}](${base}/vehiculo/${v.publicSlug}) — ${v.brand} ${v.model} ${v.year}, ${formatPrice(v.price, v.currency)}`
    )
    .join("\n");

  // `?.trim()` y no `??`: la descripción viene como string VACÍO cuando el
  // dealer no la cargó, y "" es falsy pero no null — con `??` el resumen salía
  // en blanco, que es justo el campo que el modelo usa para entender el sitio.
  const summary =
    dealership.description?.trim() ||
    `Concesionaria de vehículos${location ? ` en ${location}` : ""}. Catálogo de unidades disponibles con precios y fichas completas.`;

  const body = `# ${dealership.name}

> ${summary}

## Datos
- Ubicación: ${location || "consultar"}, ${COUNTRY_LABELS[dealership.country as keyof typeof COUNTRY_LABELS] ?? dealership.country}
${dealership.phone ? `- Teléfono: ${dealership.phone}\n` : ""}${dealership.email ? `- Email: ${dealership.email}\n` : ""}- Web: ${base}

## Páginas
- [Inicio](${base}/)
- [Catálogo completo](${base}/catalogo) — todas las unidades disponibles.
- [Cotizá tu usado](${base}/cotizar) — tasación de un vehículo para vender o permutar.
- [Opiniones](${base}/opinion) — experiencias de clientes.

## Vehículos disponibles (${vehicles.length})
${stock || "Sin unidades publicadas en este momento."}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
