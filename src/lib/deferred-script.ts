/**
 * Carga diferida de scripts de terceros (Meta Pixel, Clarity).
 *
 * POR QUÉ: `fbevents.js` + su config y `clarity.js` sumaban ~800 ms de main
 * thread bloqueado en mobile, compitiendo con la hidratación de React. Era la
 * mayor parte del Total Blocking Time de la landing en PageSpeed.
 *
 * CÓMO: el snippet de cada vendor define un STUB con cola (`fbq`, `clarity`)
 * al instante — así ningún evento se pierde y `MetaTrackEvent` / el form siguen
 * funcionando igual — pero el script pesado se inyecta recién en la primera
 * interacción del visitante o, si no interactúa, a los
 * `THIRD_PARTY_FALLBACK_MS`. Al cargar, el script vacía la cola: el PageView y
 * los eventos llegan con su `eventID` original (la deduplicación con la CAPI no
 * cambia).
 *
 * Costo: quien cierra la pestaña sin tocar nada antes del fallback no queda
 * medido por el pixel. Ese caso no es una conversión, y la CAPI no depende de
 * esto.
 */
export const THIRD_PARTY_FALLBACK_MS = 5000;

const INTERACTION_EVENTS = ["pointerdown", "keydown", "touchstart", "scroll", "mousemove"];

/** JS inline que inyecta `src` en la primera interacción o al vencer el fallback. */
export function buildDeferredScriptLoader(src: string): string {
  return `(function(){var d=0,E=${JSON.stringify(INTERACTION_EVENTS)};function go(){if(d)return;d=1;E.forEach(function(e){removeEventListener(e,go,true)});var t=document.createElement("script");t.async=1;t.src=${JSON.stringify(src)};document.head.appendChild(t)}E.forEach(function(e){addEventListener(e,go,{capture:true,passive:true})});setTimeout(go,${THIRD_PARTY_FALLBACK_MS})})();`;
}
