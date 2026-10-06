import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTenantBasePath, getTenantPublicUrl } from "@/lib/tenant";
import { getTenantDealership } from "@/lib/tenant-render";
import { optimizedImageUrl } from "@/lib/image-url";
import { TenantChrome } from "@/components/tenant/tenant-chrome";
import { MetaPixel } from "@/components/meta/meta-pixel";
import { getTenantPixelId } from "@/lib/meta/config";
import { canUseMetaPixel } from "@/lib/plans";

// ISR: el sitio del tenant se cachea en el edge de Vercel y se regenera en
// background. Sin esto cada visita renderizaba de cero (TTFB ~800 ms).
// La fuente de verdad es la invalidación activa: invalidateTenantHomeBundle()
// hace revalidatePath de todo /tenant/{slug} en cada mutación. Los 30 min son
// red de seguridad, igual que el TTL del cache de Redis (TENANT_HOME_TTL_SECONDS).
export const revalidate = 1800;

// Lista vacía = no se prerenderiza nada en el build, pero cada slug que se
// visita queda cacheado (sin generateStaticParams, Next trata el segmento
// dinámico como 100% dinámico y no cachea nada).
export function generateStaticParams(): { slug: string }[] {
  return [];
}

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dealership = await getTenantDealership(slug);

  if (!dealership) return { title: "No encontrado" };

  const title = `${dealership.name} — Vehículos`;
  // `||` y no `??`: el panel guarda la descripción vacía como "", y con `??`
  // la home salía SIN meta description (Lighthouse SEO la marca).
  const description =
    dealership.description?.trim() ||
    `Explorá los vehículos de ${dealership.name}. Encontrá tu próximo auto.`;

  // Favicon dinámico por tenant: preferimos el ícono dedicado (favicon) que el
  // dealer puede subir aparte; si no cargó uno, caemos al logo. Si no hay ninguno,
  // no devolvemos `icons` y el favicon del root (motorflow) toma por default —
  // preferible a un favicon roto.
  const iconUrl = dealership.favicon ?? dealership.logo;
  // Pasados por el optimizador: un logo de 1,5 MB servido crudo como favicon
  // se bajaba entero (dos veces: icon + apple) para mostrarse a 32 px.
  const icons = iconUrl
    ? {
        icon: optimizedImageUrl(iconUrl, 64),
        shortcut: optimizedImageUrl(iconUrl, 64),
        apple: optimizedImageUrl(iconUrl, 256),
      }
    : undefined;

  // metadataBase del ROOT apunta a motorflowapp.com. Servido desde
  // {slug}.motorflowapp.com, cualquier URL relativa (canonical, OG) resolvería
  // a NUESTRO dominio, o sea le diríamos a Google que el contenido del dealer
  // es nuestro. Por eso se overridea por tenant y el canonical va ABSOLUTO.
  //
  // getTenantPublicUrl respeta el dominio propio del dealer si cargó `website`.
  const base = getTenantPublicUrl(dealership);

  return {
    // absolute + template "%s": sin esto el template del ROOT (`%s | MotorFlow`)
    // se aplicaba a todas las páginas del dealer, home incluida. Las hijas ya
    // arman su título completo con el nombre del concesionario.
    title: { absolute: title, template: "%s" },
    description,
    icons,
    metadataBase: new URL(base),
    // Sin esto, el subdominio y motorflowapp.com/tenant/{slug} compiten como
    // contenido duplicado y Google elige cuál indexar por su cuenta.
    alternates: { canonical: base },
    openGraph: {
      title,
      description,
      type: "website",
      url: base,
      ...(dealership.logo ? { images: [dealership.logo] } : {}),
    },
    // Override explícito: si no, se heredan el título y la descripción de
    // MotorFlow del root layout, y al compartir el sitio en X se ve el nuestro.
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(dealership.logo ? { images: [dealership.logo] } : {}),
    },
  };
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { slug } = await params;
  const dealership = await getTenantDealership(slug);

  if (!dealership) notFound();

  const basePath = getTenantBasePath(slug);

  // Pixel del CONCESIONARIO (no el nuestro). Doble condición a propósito:
  //   - getTenantPixelId → el dealer lo configuró y tiene el toggle prendido
  //   - canUseMetaPixel  → su plan lo habilita
  // El segundo chequeo NO es redundante con el gating del PUT: si un dealer
  // configura el pixel en plan Media y después baja a Base, la config queda en
  // la DB y sin este guard seguiría trackeando una feature que ya no paga.
  //
  // Va acá y NO en <TenantChrome> porque el chrome lo reusa /vista-previa: si
  // estuviera adentro, cada vez que el dealer previsualiza su sitio le
  // ensuciaría las métricas con visitas propias.
  const tenantPixelId = canUseMetaPixel(dealership) ? getTenantPixelId(dealership) : null;

  return (
    <>
      {tenantPixelId && <MetaPixel pixelId={tenantPixelId} />}
      <TenantChrome dealership={dealership} basePath={basePath}>
        {children}
      </TenantChrome>
    </>
  );
}
