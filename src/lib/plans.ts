import { Dealership } from "@prisma/client";

export type PlanType = "base" | "media" | "premium" | "enterprise";

export interface PlanLimits {
  maxVehicles: number;
  maxCustomers: number;
  maxUsers: number;
  allowBulkActions: boolean;
  allowMLIntegration: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  base: {
    maxVehicles: 30,
    maxCustomers: 50,
    maxUsers: 1, // Solo el dueño
    allowBulkActions: false,
    allowMLIntegration: false,
  },
  media: {
    maxVehicles: 100,
    maxCustomers: 2000,
    maxUsers: 3, // Dueño + 2 vendedores
    allowBulkActions: true,
    allowMLIntegration: true, // ML habilitado a partir de este plan (~90k)
  },
  premium: {
    maxVehicles: Infinity,
    maxCustomers: 10000,
    maxUsers: Infinity,
    allowBulkActions: true,
    allowMLIntegration: true,
  },
  enterprise: {
    maxVehicles: Infinity,
    maxCustomers: Infinity,
    maxUsers: Infinity,
    allowBulkActions: true,
    allowMLIntegration: true,
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
 * Verifica si el concesionario puede agregar más vehículos.
 */
export function canAddMoreVehicles(dealership: Pick<Dealership, "plan">, currentCount: number): boolean {
  const limit = getPlanLimits(dealership).maxVehicles;
  return currentCount < limit;
}
