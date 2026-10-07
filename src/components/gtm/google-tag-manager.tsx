import Script from "next/script";

interface GoogleTagManagerProps {
  /** Ya validado por `isValidGtmId` en el server que monta el componente. */
  containerId: string;
}

/**
 * Monta Google Tag Manager (y con él GA4, que se configura en el contenedor).
 *
 * Server Component: para medir las navegaciones del App Router, en GTM usá el
 * trigger "Historial" o dejá activada la "medición mejorada" de GA4 (cambios
 * de página basados en el historial del navegador). No hace falta un efecto
 * sobre `pathname` como en `MetaPixel`.
 *
 * El `<noscript>` queda dentro del `<body>` (todo lo que renderiza un layout va
 * ahí), que es lo que pide Google.
 */
export function GoogleTagManager({ containerId }: GoogleTagManagerProps) {
  return (
    <>
      <Script
        id="google-tag-manager"
        // afterInteractive: no compite con el render inicial (mismo criterio que el pixel).
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');
          `.trim(),
        }}
      />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  );
}
