import { isSelfServeEnabled } from "@/lib/seo";

/**
 * Destino del CTA de un plan — fuente ÚNICA para las DOS superficies de pricing
 * (PricingCards en la landing y PricingTable en /precios).
 *
 * Existe por una razón concreta: esta lógica vivía duplicada y se desincronizó.
 * Con NEXT_PUBLIC_ENABLE_LOGIN ya en true, las cards seguían empujando a
 * #contacto hardcodeado y el visitante nunca llegaba al registro.
 *
 * Reglas:
 * - Sin self-serve, /sign-up rebota a "/" (ver sign-up/page.tsx): mandar ahí es
 *   perder el lead en el click más caro de la página. Caemos al formulario.
 * - Enterprise nunca es autoservicio: es venta asistida, siempre al formulario.
 * - El ancla lleva "/" adelante a propósito. En /precios NO hay sección de
 *   contacto, así que un "#contacto" pelado no navega a ningún lado.
 */
export function getPlanCtaHref(planKey: string): string {
  const isSelfServe = isSelfServeEnabled() && planKey !== "enterprise";
  return isSelfServe ? "/sign-up" : "/#contacto";
}

/**
 * Guarda el plan elegido antes de navegar. La lee el form de contacto para
 * marcar intent="plan" y, con self-serve prendido, el onboarding para
 * preseleccionar el plan.
 */
export function rememberSelectedPlan(planKey: string): void {
  document.cookie = `selected_plan_id=${planKey}; path=/; max-age=3600`;
}
