import { notFound } from "next/navigation";
import { getTenantHomeBundle, getTenantBasePath, getTenantPublicUrl } from "@/lib/tenant";
import { TenantHomeContent } from "@/components/tenant/tenant-home-content";
import { JsonLd } from "@/components/seo/json-ld";

interface TenantHomePageProps {
  params: Promise<{ slug: string }>;
}

export default async function TenantHomePage({ params }: TenantHomePageProps) {
  const { slug } = await params;
  const bundle = await getTenantHomeBundle(slug);
  if (!bundle) notFound();

  const basePath = await getTenantBasePath(slug);

  // Structured data AutoDealer (LocalBusiness): le dice a Google/IA que esto es
  // una concesionaria, con su contacto y ubicación. Alimenta el pack local y las
  // respuestas de IA tipo "concesionarias en [ciudad]".
  const d = bundle.dealership;
  const publicUrl = getTenantPublicUrl(d);
  const hasAddress = Boolean(d.address || d.city || d.province);
  const dealerLd = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": `${publicUrl}/#dealer`,
    name: d.name,
    url: publicUrl,
    ...(d.logo ? { logo: d.logo, image: d.logo } : {}),
    ...(d.description ? { description: d.description } : {}),
    ...(d.phone ? { telephone: d.phone } : {}),
    ...(d.email ? { email: d.email } : {}),
    ...(hasAddress
      ? {
          address: {
            "@type": "PostalAddress",
            ...(d.address ? { streetAddress: d.address } : {}),
            ...(d.city ? { addressLocality: d.city } : {}),
            ...(d.province ? { addressRegion: d.province } : {}),
            addressCountry: "AR",
          },
        }
      : {}),
    areaServed: { "@type": "Country", name: "Argentina" },
  };

  return (
    <>
      <JsonLd data={dealerLd} />
      <TenantHomeContent bundle={bundle} basePath={basePath} />
    </>
  );
}
