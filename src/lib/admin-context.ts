import "server-only";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import type { DealershipUser } from "@prisma/client";
import { prisma } from "./prisma";
import { getCurrentDealership, type DealershipWithUser } from "./auth";
import { isSuperAdmin } from "./super-admin";

/**
 * Modo plataforma: el super-admin edita el SITIO WEB de una cuenta ajena
 * reusando el site-builder que ya existe.
 *
 * ============================================================================
 * POR QUÉ ESTO NO VIVE EN getCurrentDealership()
 * ============================================================================
 * Tentador: cambiás una función y el motor entero opera sobre otro tenant. Pero
 * getCurrentDealership() es el corazón del multi-tenancy — la usan /dashboard/
 * ventas, /clientes y los legajos (que tienen DNI y facturas de terceros). Meter
 * impersonación ahí adentro filtra el modo a TODA la app.
 *
 * Por eso el override vive acá, en una función aparte, y se aplica SOLO en los
 * handlers del site-builder. El alcance queda acotado por construcción, no por
 * acordarse de tener cuidado.
 *
 * ============================================================================
 * POR QUÉ LA COOKIE NO NECESITA FIRMA
 * ============================================================================
 * La cookie NO es la autorización: solo dice "sobre qué cuenta". La
 * autorización es `isSuperAdmin(userId)` y se re-verifica en CADA request. Si un
 * usuario común forja la cookie, esta función la ignora y le devuelve su propia
 * cuenta. Lo peor que logra un super-admin manipulándola es apuntar a otro
 * dealership — que es exactamente lo que el modo le permite hacer igual.
 */

export const PLATFORM_EDIT_COOKIE = "mf_platform_edit";

// TTL corto a propósito: el modo se abandona solo. Un super-admin que se olvidó
// de salir no queda editando la cuenta de un cliente por tiempo indefinido.
export const PLATFORM_EDIT_MAX_AGE = 2 * 60 * 60; // 2 horas

export interface DealershipContext {
  dealership: DealershipWithUser;
  /** true si el super-admin está operando sobre una cuenta ajena. */
  actingAsPlatform: boolean;
  /** Clerk userId del super-admin. Solo para auditoría; null en modo normal. */
  actingSuperAdminId: string | null;
}

/**
 * `currentUser` sintético para el modo plataforma. El super-admin NO tiene fila
 * en DealershipUser para esa cuenta (y no queremos crearla: ensuciaría el conteo
 * de usuarios del plan del cliente).
 *
 * OJO: el `id` es un centinela, NO un cuid válido. Hoy es seguro porque el
 * código solo lee `currentUser.role` — verificado con un grep de `currentUser.`
 * en todo src/. Si algún día se escribe `currentUser.id` en DB, esto revienta
 * con un FK error. Ese error es preferible a una fila fantasma en DealershipUser.
 */
function platformCurrentUser(userId: string, dealershipId: string): DealershipUser {
  return {
    id: "platform-super-admin",
    clerkUserId: userId,
    dealershipId,
    role: "admin",
    createdAt: new Date(),
  };
}

/**
 * Resuelve sobre qué concesionario opera el site-builder.
 *
 * Usar SOLO en la superficie del builder: /api/concesionario/{route,theme,logo,
 * favicon,sections/*,media/*} y las pages del editor. El resto del dashboard
 * sigue con getCurrentDealership() y nunca ve este modo.
 */
export async function resolveSiteBuilderContext(): Promise<DealershipContext | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const targetId = (await cookies()).get(PLATFORM_EDIT_COOKIE)?.value;

  if (targetId && isSuperAdmin(userId)) {
    const dealership = await prisma.dealership.findUnique({ where: { id: targetId } });
    // Cuenta borrada con la cookie todavía viva: no caemos a la propia del
    // super-admin en silencio (editaría la equivocada creyendo estar en otra).
    if (!dealership) return null;

    return {
      dealership: {
        ...dealership,
        currentUser: platformCurrentUser(userId, dealership.id),
      },
      actingAsPlatform: true,
      actingSuperAdminId: userId,
    };
  }

  const own = await getCurrentDealership();
  if (!own) return null;

  return { dealership: own, actingAsPlatform: false, actingSuperAdminId: null };
}

/**
 * Id del dealership en edición por plataforma, o null. Para las pages que
 * necesitan saber si el modo está activo sin resolver el dealership entero
 * (ej: el guard de /dashboard/sitio-web).
 */
export async function getPlatformEditTargetId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId || !isSuperAdmin(userId)) return null;
  return (await cookies()).get(PLATFORM_EDIT_COOKIE)?.value ?? null;
}

/**
 * Campos de auditoría para el logger. En modo normal devuelve {} — no ensucia
 * los logs de los dealers con claves vacías.
 */
export function auditFields(ctx: DealershipContext): Record<string, string> {
  return ctx.actingAsPlatform && ctx.actingSuperAdminId
    ? { actingSuperAdmin: ctx.actingSuperAdminId }
    : {};
}
