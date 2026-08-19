"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

interface MetaPixelProps {
  /** Ya validado por `isValidMetaPixelId` en el server que monta el componente. */
  pixelId: string;
}

/**
 * Monta el pixel de Meta y mantiene el PageView al día en el App Router.
 *
 * DOS COSAS NO OBVIAS:
 *
 * 1. `fbq` NO detecta las navegaciones del App Router. El snippet oficial de
 *    Meta asume MPA: dispara un PageView al cargar y listo. Con navegación
 *    client-side, el visitante recorre 5 páginas y Meta ve 1. Por eso el
 *    `useEffect` sobre `pathname`.
 *
 * 2. El primer PageView lo dispara el snippet inline, así que el efecto se
 *    SALTEA su primera corrida. Sin ese guard, la primera visita cuenta doble.
 *
 * Se escucha `pathname` y no los searchParams a propósito: `useSearchParams()`
 * obliga a envolver todo en <Suspense>, y un cambio de filtro del catálogo
 * (?brand=ford) no es una vista de página nueva.
 */
export function MetaPixel({ pixelId }: MetaPixelProps) {
  const pathname = usePathname();
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        // afterInteractive y no beforeInteractive: el pixel no debe competir por
        // ancho de banda con el render inicial. Un LCP peor te sube el CPC más
        // de lo que te aporta medir 200ms antes.
        dangerouslySetInnerHTML={{
          __html: `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
          `.trim(),
        }}
      />
      <noscript>
        {/* Fallback sin JS. Es un <img> plano a propósito: next/image lo
            optimizaría y rompería el tracking. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
