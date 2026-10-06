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
  const dealershipUser = await prisma.dealershipUser.findFirst({
    where: { clerkUserId: userId },
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
