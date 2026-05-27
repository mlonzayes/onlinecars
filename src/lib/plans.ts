import { Dealership } from "@prisma/client";

export type PlanType = "base" | "media" | "premium" | "enterprise";

export interface PlanLimits {
  maxVehicles: number;
  maxCustomers: number;
  maxUsers: number;
  allowBulkActions: boolean;
  allowMLIntegration: boolean;
  // Botón flotante de WhatsApp en el sitio público del tenant.
  // Feature de retención clave: el dealer ve consultas convertirse en chats
  // directos sin formularios → motiva el upgrade desde el plan base.
  allowWhatsappFab: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  base: {
    maxVehicles: 30,
    maxCustomers: 50,
    maxUsers: 1, // Solo el dueño
    allowBulkActions: false,
    allowMLIntegration: false,
    allowWhatsappFab: false, // Gancho para upgrade
  },
  media: {
    maxVehicles: 100,
    maxCustomers: 2000,
    maxUsers: 3, // Dueño + 2 vendedores
    allowBulkActions: true,
    allowMLIntegration: true, // ML habilitado a partir de este plan (~90k)
    allowWhatsappFab: true,
  },
  premium: {
    maxVehicles: Infinity,
    maxCustomers: 10000,
    maxUsers: Infinity,
    allowBulkActions: true,
    allowMLIntegration: true,
    allowWhatsappFab: true,
  },
  enterprise: {
    maxVehicles: Infinity,
    maxCustomers: Infinity,
    maxUsers: Infinity,
    allowBulkActions: true,
    allowMLIntegration: true,
    allowWhatsappFab: true,
  },
};

/**
 * Retorna los límites asociados al plan actual del concesionario.
 */
export function getPlanLimits(dealership: Pick<Dealership, "plan">): PlanLimits {
  const plan = (dealership.plan as PlanType) || "base";
  return PLAN_LIMITS[plan] || PLAN_LIMITS.base;
}

/**
 * Verifica si el concesionario tiene acceso a Mercado Libre.
 */
export function canUseML(dealership: Pick<Dealership, "plan">): boolean {
  return getPlanLimits(dealership).allowMLIntegration;
}

/**
 * Verifica si el concesionario tiene acceso a acciones masivas (bulk).
 */
export function canUseBulkActions(dealership: Pick<Dealership, "plan">): boolean {
  return getPlanLimits(dealership).allowBulkActions;
}

/**
 * Verifica si el concesionario puede publicar más vehículos.
 *
 * IMPORTANTE: el límite del plan se cuenta por vehículos PUBLICADOS
 * (`publishedAt IS NOT NULL`), NO por total de vehículos cargados.
 * Razones:
 *  - Los vendidos quedan en DB como histórico contable, no deberían
 *    ocupar el slot del plan
 *  - Los drafts (sin publicar) son trabajo del user, no consumen recursos
 *    de la web pública
 *
 * `publishedCount` lo pasa el caller (el handler hace count antes de invocar).
 */
export function canPublishMoreVehicles(
  dealership: Pick<Dealership, "plan">,
  publishedCount: number
): boolean {
  const limit = getPlanLimits(dealership).maxVehicles;
  return publishedCount < limit;
}

/**
 * @deprecated Usar canPublishMoreVehicles. El plan se cuenta por publicados.
 */
export function canAddMoreVehicles(dealership: Pick<Dealership, "plan">, currentCount: number): boolean {
  return canPublishMoreVehicles(dealership, currentCount);
}
