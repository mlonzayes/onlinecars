import type { Dealership } from "@prisma/client";

export type AccountBlockReason = "suspended" | "expired";

/**
 * Motivo por el que la cuenta no puede operar, o null si está activa.
 *
 * Fuente única para el layout del dashboard y para los servicios (que también
 * los usa el MCP): una cuenta pausada no debe poder operar por ningún canal.
 *
 * El cron diario marca como "expired" los trials vencidos, pero si todavía no
 * corrió y `trialEndsAt` ya pasó, lo tratamos igual como vencido.
 */
export function getAccountBlockReason(
  dealership: Pick<Dealership, "subscriptionStatus" | "trialEndsAt">,
  now: number = Date.now()
): AccountBlockReason | null {
  if (dealership.subscriptionStatus === "suspended") return "suspended";
  if (dealership.subscriptionStatus === "expired") return "expired";

  const trialExpiredButNotYetMarked =
    dealership.subscriptionStatus === "trial" &&
    dealership.trialEndsAt !== null &&
    dealership.trialEndsAt.getTime() < now;

  return trialExpiredButNotYetMarked ? "expired" : null;
}
