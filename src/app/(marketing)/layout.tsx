import { MetaPixel } from "@/components/meta/meta-pixel";
import { getMainSitePixelId } from "@/lib/meta/config";
import { MicrosoftClarity } from "@/components/clarity/microsoft-clarity";
import { getMainSiteClarityId } from "@/lib/clarity/config";

/**
 * Layout de la superficie de MARKETING (motorflowapp.com): landing, precios,
 * blog, términos y privacidad. El route group no cambia ninguna URL — `/` sigue
 * siendo `/` — solo agrupa las páginas que comparten esta capa.
 *
 * ACÁ VIVE EL PIXEL DE LA WEB PRINCIPAL, y en un solo lugar. Por qué no en el
 * root layout: el root envuelve TAMBIÉN el dashboard, el panel de admin y los
 * sitios de los concesionarios. Montarlo ahí mandaría a nuestro Ads Manager el
 * tráfico de los visitantes de cada concesionario, ensuciando los públicos
 * similares y el costo por lead con gente que nunca fue nuestro prospecto.
 *
 * Cada tenant monta SU propio pixel en `app/tenant/[slug]/layout.tsx`.
 *
 * Microsoft Clarity (heatmaps + grabaciones) vive acá por la misma razón: mide
 * NUESTRO funnel, no el de los concesionarios.
 *
 * Sin <AppClerkProvider> a propósito: ninguna página de marketing usa
 * componentes ni hooks de Clerk en el cliente (el navbar resuelve la sesión con
 * `auth()` en el server, que lo cubre el middleware). Montarlo descargaba
 * ~350 KB de JS + fetches a la API de Clerk en cada visita a la landing.
 * Si una página de marketing necesita <SignInButton> o similar, se envuelve
 * ESA página, no todo el grupo.
 *
 * ⚠️ Página de marketing nueva → va DENTRO de este grupo, o no se mide.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pixelId = getMainSitePixelId();
  const clarityId = getMainSiteClarityId();

  return (
    <>
      {pixelId && <MetaPixel pixelId={pixelId} />}
      {clarityId && <MicrosoftClarity projectId={clarityId} />}
      {children}
    </>
  );
}
