/**
 * Catálogo de eventos de Meta que usamos.
 *
 * Son los eventos ESTÁNDAR de Meta — no inventar nombres propios salvo que haya
 * una razón fuerte. Los estándar habilitan optimización de campaña, públicos
 * similares (lookalike) y las columnas de conversión del Ads Manager. Un evento
 * custom no te da nada de eso.
 */
export const META_STANDARD_EVENTS = [
  "PageView",
  "ViewContent",
  "Search",
  "Lead",
  "Contact",
  "CompleteRegistration",
  "InitiateCheckout",
  "Schedule",
  "SubmitApplication",
  "AddToWishlist",
  "Purchase",
] as const;

export type MetaEventName = (typeof META_STANDARD_EVENTS)[number];

/**
 * Qué significa cada evento EN ESTE producto. Sin este mapeo, en tres meses
 * nadie se acuerda por qué el catálogo dispara ViewContent y no Search.
 *
 * Web principal (motorflowapp.com — vendemos el SaaS):
 *   ViewContent  → visita a /precios (miró los planes)
 *   Lead         → mandó el form de contacto  ← LA conversión a optimizar
 *
 * Sitio del tenant (el concesionario vende autos):
 *   ViewContent  → abrió la ficha de un vehículo
 *   Lead         → dejó una consulta por un vehículo
 *   Contact      → tocó el WhatsApp / teléfono
 */
export const META_EVENT_PURPOSE: Record<string, string> = {
  ViewContent: "Vio una ficha de producto (plan o vehículo)",
  Lead: "Dejó sus datos en un formulario",
  Contact: "Abrió un canal de contacto directo (WhatsApp / teléfono)",
  CompleteRegistration: "Completó el alta de la cuenta",
};

/**
 * Cookies que setea el pixel en el browser y que la Conversions API necesita
 * para deduplicar y atribuir. Se leen server-side desde el request.
 */
export const META_BROWSER_ID_COOKIE = "_fbp";
export const META_CLICK_ID_COOKIE = "_fbc";

/**
 * Nombre del campo con el que el cliente manda el `eventId` compartido.
 *
 * CRÍTICO: el MISMO evento se manda dos veces — una del browser (pixel) y otra
 * del server (CAPI). Meta las deduplica si comparten `eventName` + `eventId`.
 * Si este campo no llega, contás la conversión DOBLE y tomás decisiones de
 * inversión con el ROAS inflado.
 */
export const META_EVENT_ID_FIELD = "metaEventId";
