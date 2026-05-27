import type { Dealership, DealershipUser } from "@prisma/client";

/**
 * Indica si el user logueado puede ver el precio de costo de los vehículos.
 *
 * Reglas:
 *   - Los admins SIEMPRE ven el costo
 *   - Los demás roles (editor, viewer) lo ven solo si el dealership tiene
 *     `showCostsToNonAdmins=true`
 *
 * Mantener un único helper para esto evita inconsistencias entre handlers,
 * forms y vistas. Cualquier endpoint que devuelva costPrice DEBE filtrarlo
 * con esta función.
 */
export function canSeeCosts(
  user: Pick<DealershipUser, "role">,
  dealership: Pick<Dealership, "showCostsToNonAdmins">
): boolean {
  if (user.role === "admin") return true;
  return dealership.showCostsToNonAdmins;
}

/**
 * Indica si el user puede EDITAR (cargar/modificar) el precio de costo.
 * Más estricto que ver: editar costos siempre requiere admin.
 */
export function canEditCosts(user: Pick<DealershipUser, "role">): boolean {
  return user.role === "admin";
}
