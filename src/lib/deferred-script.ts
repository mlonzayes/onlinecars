/**
 * Carga diferida de scripts de terceros que NO miden conversiones (hoy: Clarity).
 *
 * POR QUÉ: `clarity.js` compite con la hidratación de React en mobile y suma
 * Total Blocking Time en PageSpeed.
 *
 * CÓMO: el snippet define un STUB con cola (`clarity`) al instante — así ningún
 * evento se pierde — pero el script pesado se inyecta recién en la primera
 * interacción del visitante o, si no interactúa, a los `THIRD_PARTY_FALLBACK_MS`.
 *
 * ⚠️ El Meta Pixel NO se difiere a propósito: quien llega de un anuncio y se va
 * sin tocar nada antes del fallback no quedaría en el PageView, y esos visitantes
 * son justo los públicos de retargeting de las campañas.
 */
export const THIRD_PARTY_FALLBACK_MS = 5000;

const INTERACTION_EVENTS = ["pointerdown", "keydown", "touchstart", "scroll", "mousemove"];

/** JS inline que inyecta `src` en la primera interacción o al vencer el fallback. */
export function buildDeferredScriptLoader(src: string): string {
  return `(function(){var d=0,E=${JSON.stringify(INTERACTION_EVENTS)};function go(){if(d)return;d=1;E.forEach(function(e){removeEventListener(e,go,true)});var t=document.createElement("script");t.async=1;t.src=${JSON.stringify(src)};document.head.appendChild(t)}E.forEach(function(e){addEventListener(e,go,{capture:true,passive:true})});setTimeout(go,${THIRD_PARTY_FALLBACK_MS})})();`;
}
