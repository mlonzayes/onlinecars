import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import type { Dealership, DealershipUser } from "@prisma/client";
import { cache } from "react";

export type DealershipWithUser = Dealership & {
  currentUser: DealershipUser;
};

/**
 * Resuelve el dealership de un usuario de Clerk. La usan la sesión del panel
 * (vía getCurrentDealership) y el MCP, que trae el userId de un token OAuth.
 */
export async function getDealershipForUser(userId: string): Promise<DealershipWithUser | null> {
  // Un usuario puede pertenecer a más de un concesionario (ej: lo invitaron a
  // otro). Sin orden, Postgres devuelve cualquiera y el panel podía alternar
  // entre cuentas de una request a otra. Hasta que haya selector de cuenta,
  // manda el vínculo más antiguo: el concesionario con el que se registró.
  const dealershipUser = await prisma.dealershipUser.findFirst({
    where: { clerkUserId: userId },
    orderBy: { createdAt: "asc" },
    include: { dealership: true },
  });

  if (!dealershipUser) return null;

  const { dealership, ...currentUser } = dealershipUser;
  return { ...dealership, currentUser };
}

export const getCurrentDealership = cache(async (): Promise<DealershipWithUser | null> => {
  const { userId } = await auth();
  if (!userId) return null;
  return getDealershipForUser(userId);
});
