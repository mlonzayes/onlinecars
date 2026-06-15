import { prisma } from "./prisma";

/**
 * Versión vigente de los documentos legales (Términos y Condiciones + Política
 * de Privacidad, que se aceptan juntos).
 *
 * IMPORTANTE: cuando modifiques el contenido legal de forma sustancial, BUMPEÁ
 * esta constante (usamos la fecha de la nueva versión). Eso hace que el gate del
 * dashboard detecte que el usuario aceptó una versión vieja y lo obligue a volver
 * a aceptar la nueva. El historial queda registrado en la tabla terms_acceptances.
 */
export const CURRENT_LEGAL_VERSION = "2026-06-15";

/** ¿El usuario ya aceptó la versión legal vigente? */
export async function hasAcceptedCurrentTerms(clerkUserId: string): Promise<boolean> {
  const acceptance = await prisma.termsAcceptance.findFirst({
    where: { clerkUserId, version: CURRENT_LEGAL_VERSION },
    select: { id: true },
  });
  return acceptance !== null;
}

/**
 * Registra la aceptación de la versión vigente para un usuario. Idempotente:
 * si ya aceptó esta versión, no duplica la fila.
 */
export async function recordTermsAcceptance(
  clerkUserId: string,
  dealershipId?: string | null
): Promise<void> {
  const existing = await prisma.termsAcceptance.findFirst({
    where: { clerkUserId, version: CURRENT_LEGAL_VERSION },
    select: { id: true },
  });
  if (existing) return;

  await prisma.termsAcceptance.create({
    data: {
      clerkUserId,
      dealershipId: dealershipId ?? null,
      version: CURRENT_LEGAL_VERSION,
    },
  });
}
