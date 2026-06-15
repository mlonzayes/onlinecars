import { Dealership } from "@prisma/client";

// "trial" es el plan default al crear una cuenta (período de prueba). No es
// asignable ni vendible — es el techo apretado para demos. Los planes pagos son
// base | media | premium | enterprise.
export type PlanType = "trial" | "base" | "media" | "premium" | "enterprise";

export interface PlanLimits {
  maxVehicles: number;
  maxUsers: number;
  // Máximo de imágenes por vehículo. Base apretado para que el dealer vea el
  // techo en el día a día y suba a Media. Vender autos online ES vender fotos.
  maxImagesPerVehicle: number;
  allowBulkActions: boolean;
  allowMLIntegration: boolean;
  // Botón flotante de WhatsApp en el sitio público del tenant.
  // Feature de retención clave: el dealer ve consultas convertirse en chats
  // directos sin formularios → motiva el upgrade desde el plan base.
  allowWhatsappFab: boolean;
  // Si true, el sitio público del tenant muestra el badge "Powered by motorflow"
  // en el footer. Gancho de upgrade clásico: el dealer quiere su sitio limpio.
  showPoweredBy: boolean;
}

// Nota sobre clientes (CRM): NO hay límite por diseño.
// Razón: Sale.customer tiene onDelete: Restrict, así que un cliente con venta
// asociada no se puede borrar. Si pusiéramos límite, el dealer quedaría
// atrapado sin poder operar al alcanzarlo. Los clientes son histórico contable,
// no recurso operativo.

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  trial: {
    maxVehicles: 10, // Techo apretado del período de prueba
    maxUsers: 1, // Solo el dueño
    maxImagesPerVehicle: 8,
    allowBulkActions: false,
    allowMLIntegration: false,
    allowWhatsappFab: false,
    showPoweredBy: true,
  },
  base: {
    maxVehicles: 30,
    maxUsers: 1, // Solo el dueño
    maxImagesPerVehicle: 8,
    allowBulkActions: false,
    allowMLIntegration: false,
    allowWhatsappFab: false, // Gancho para upgrade
    showPoweredBy: true, // Badge "Powered by motorflow" en el footer del tenant
  },
  media: {
    maxVehicles: 100,
    maxUsers: 3, // Dueño + 2 vendedores
    maxImagesPerVehicle: 15,
    allowBulkActions: true,
    allowMLIntegration: true, // ML habilitado a partir de este plan
    allowWhatsappFab: true,
    showPoweredBy: false,
  },
  premium: {
    maxVehicles: Infinity,
    maxUsers: Infinity,
    maxImagesPerVehicle: Infinity,
    allowBulkActions: true,
    allowMLIntegration: true,
    allowWhatsappFab: true,
    showPoweredBy: false,
  },
  enterprise: {
    maxVehicles: Infinity,
    maxUsers: Infinity,
    maxImagesPerVehicle: Infinity,
    allowBulkActions: true,
    allowMLIntegration: true,
    allowWhatsappFab: true,
    showPoweredBy: false,
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
