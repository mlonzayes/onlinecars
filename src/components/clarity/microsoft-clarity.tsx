import Script from "next/script";
import { buildDeferredScriptLoader } from "@/lib/deferred-script";

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
      // Stub con cola ya; `clarity.js` diferido — ver lib/deferred-script.ts.
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
window.clarity=window.clarity||function(){(window.clarity.q=window.clarity.q||[]).push(arguments)};
${buildDeferredScriptLoader(`https://www.clarity.ms/tag/${projectId}`)}
        `.trim(),
      }}
    />
  );
}
