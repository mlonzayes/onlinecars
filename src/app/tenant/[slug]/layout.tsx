import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDealershipBySlug, getTenantBasePath } from "@/lib/tenant";
import { TenantChrome } from "@/components/tenant/tenant-chrome";
import { MetaPixel } from "@/components/meta/meta-pixel";
import { getTenantPixelId } from "@/lib/meta/config";
import { canUseMetaPixel } from "@/lib/plans";

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
  const dealership = await getDealershipBySlug(slug);

  if (!dealership) return { title: "No encontrado" };

  const title = `${dealership.name} — Vehículos`;
  const description =
    dealership.description ??
    `Explorá los vehículos de ${dealership.name}. Encontrá tu próximo auto.`;

  // Favicon dinámico por tenant: preferimos el ícono dedicado (favicon) que el
  // dealer puede subir aparte; si no cargó uno, caemos al logo. Si no hay ninguno,
  // no devolvemos `icons` y el favicon del root (motorflow) toma por default —
  // preferible a un favicon roto.
  const iconUrl = dealership.favicon ?? dealership.logo;
  const icons = iconUrl
    ? { icon: iconUrl, shortcut: iconUrl, apple: iconUrl }
    : undefined;

  return {
    title,
    description,
    icons,
    openGraph: {
      title,
      description,
      type: "website",
      ...(dealership.logo ? { images: [dealership.logo] } : {}),
    },
  };
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { slug } = await params;
  const dealership = await getDealershipBySlug(slug);

  if (!dealership) notFound();

  const basePath = await getTenantBasePath(slug);

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
