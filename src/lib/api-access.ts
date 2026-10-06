import { NextResponse } from "next/server";
import { getAccountBlockReason } from "@/lib/account-status";
import { canWrite } from "@/lib/permissions";
import { logger } from "@/lib/logger";
import type { DealershipWithUser } from "@/lib/auth";

export type ApiAccess = "read" | "write";

/**
 * Chequeo común de TODA la API autenticada del panel, después de resolver el
 * concesionario. Devuelve la respuesta de error, o null si puede seguir:
 *
 * - Cuenta suspendida o vencida → 403. El layout del dashboard ya la bloqueaba,
 *   pero la API quedaba abierta para quien tuviera la sesión iniciada.
 * - Escritura con rol de solo lectura (viewer) → 403.
 *
 * `asPlatform`: el super-admin en modo plataforma (ver admin-context.ts) opera
 * sin estas restricciones — tiene que poder arreglar la cuenta de un cliente
 * aunque esté suspendida.
 *
 * Uso, justo después del `if (!dealership)`:
 *   const denied = denyApiAccess(requestId, dealership, "write");
 *   if (denied) return denied;
 */
export function denyApiAccess(
  requestId: string | undefined,
  dealership: DealershipWithUser,
  access: ApiAccess,
  asPlatform = false
): NextResponse | null {
  if (asPlatform) return null;

  const blockReason = getAccountBlockReason(dealership);
  if (blockReason) {
    logger.warn(requestId, "api.access.account_blocked", {
      dealershipId: dealership.id,
      reason: blockReason,
    });
    return NextResponse.json(
      {
        error:
          blockReason === "suspended"
            ? "Tu cuenta está suspendida. Contactanos para reactivarla."
            : "Tu período de prueba o suscripción venció. Renovala para seguir operando.",
        code: "account_blocked",
      },
      { status: 403 }
    );
  }

  if (access === "write" && !canWrite(dealership.currentUser)) {
    logger.warn(requestId, "api.access.read_only_role", {
      dealershipId: dealership.id,
      role: dealership.currentUser.role,
    });
    return NextResponse.json(
      { error: "Tu usuario es de solo lectura: no puede hacer cambios.", code: "read_only" },
      { status: 403 }
    );
  }

  return null;
}
