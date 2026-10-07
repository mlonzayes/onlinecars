import Script from "next/script";

interface GoogleAnalyticsProps {
  /** Ya validado por `isValidGaMeasurementId` en el server que monta el componente. */
  measurementId: string;
}

/**
 * Monta Google Analytics 4 (gtag.js).
 *
 * Server Component, igual que Clarity: la "medición mejorada" de GA4 (activa
 * por default en el flujo web) registra como page_view los cambios de URL por
 * History API, así que las navegaciones del App Router se cuentan solas. Si se
 * apaga "Cambios de página según el historial del navegador" en GA4, se pierden.
 */
export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  return (
    <>
      <Script
        id="google-analytics-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}');
          `.trim(),
        }}
      />
    </>
  );
}
