import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import type { Dealership, DealershipUser } from "@prisma/client";

export type DealershipWithUser = Dealership & {
  currentUser: DealershipUser;
};

export async function getCurrentDealership(): Promise<DealershipWithUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const dealershipUser = await prisma.dealershipUser.findFirst({
    where: { clerkUserId: userId },
    include: { dealership: true },
  });

  if (!dealershipUser) return null;

  return {
    ...dealershipUser.dealership,
    currentUser: dealershipUser,
  };
}
