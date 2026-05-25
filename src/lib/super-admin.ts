/**
 * Super admin = el dueño de la plataforma (vos, no los dealerships).
 *
 * Identificación: lista de Clerk userIds en la env var SUPER_ADMIN_CLERK_USER_IDS,
 * separados por coma. Ej: SUPER_ADMIN_CLERK_USER_IDS=user_abc123,user_xyz789
 *
 * Decisión de diseño: no agregamos un rol nuevo en DB para esto porque:
 *  - Son 1-2 personas máximo (vos + socio quizás)
 *  - El acceso vive cross-tenant (no pertenece a ningún dealership)
 *  - Si lo metés en DealershipUser.role mezclás conceptos
 *  - Cambiar la lista es deploy + env var update, no requiere migración
 */

function getSuperAdminIds(): Set<string> {
  const raw = process.env.SUPER_ADMIN_CLERK_USER_IDS ?? "";
  return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
}

/**
 * Indica si un Clerk userId es super admin de la plataforma.
 * Usar en endpoints /api/admin/* y páginas /admin/* para gatear acceso.
 */
export function isSuperAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return getSuperAdminIds().has(userId);
}
