import Script from "next/script";

interface MicrosoftClarityProps {
  /** Ya validado por `isValidClarityProjectId` en el server que monta el componente. */
  projectId: string;
}

/**
 * Monta Microsoft Clarity (heatmaps + grabaciones de sesión).
 *
 * A diferencia de `MetaPixel`, NO hace falta escuchar `pathname`: Clarity
 * engancha la History API solo y registra las navegaciones del App Router.
 * Por eso esto es un Server Component.
 *
 * Clarity enmascara por default los inputs ("Balanced"): lo que el visitante
 * tipea en el form de contacto NO queda en las grabaciones. No bajar el
 * masking a "Relaxed" desde el panel de Clarity.
 */
export function MicrosoftClarity({ projectId }: MicrosoftClarityProps) {
  return (
    <Script
      id="microsoft-clarity"
      // afterInteractive: no compite con el render inicial (mismo criterio que el pixel).
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script","${projectId}");
        `.trim(),
      }}
    />
  );
}
