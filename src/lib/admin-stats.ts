import "server-only";
import { prisma } from "@/lib/prisma";

// Datos del panel de plataforma (super-admin). Cross-tenant: lista TODOS los
// dealerships con sus cantidades y el estado de suscripción. NO scoped por tenant
// — el acceso se gatea con isSuperAdmin antes de llamar a esto.

export interface PlatformAccount {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  // Días que faltan para que venza el trial. null si no está en trial / sin fecha.
  // Puede ser negativo si ya venció pero el cron todavía no lo marcó.
  trialDaysLeft: number | null;
  createdAt: string;
  counts: { vehicles: number; leads: number; sales: number; customers: number };
}

export interface PlatformSummary {
  total: number;
  trial: number;
  active: number;
  expired: number;
  suspended: number;
}

export interface PlatformData {
  accounts: PlatformAccount[];
  summary: PlatformSummary;
}

export async function getPlatformData(): Promise<PlatformData> {
  const rows = await prisma.dealership.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      phone: true,
      whatsapp: true,
      plan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      createdAt: true,
      _count: { select: { vehicles: true, leads: true, sales: true, customers: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = Date.now();
  const accounts: PlatformAccount[] = rows.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    email: d.email,
    phone: d.phone,
    whatsapp: d.whatsapp,
    plan: d.plan,
    subscriptionStatus: d.subscriptionStatus,
    trialEndsAt: d.trialEndsAt?.toISOString() ?? null,
    trialDaysLeft: d.trialEndsAt
      ? Math.ceil((d.trialEndsAt.getTime() - now) / 86_400_000)
      : null,
    createdAt: d.createdAt.toISOString(),
    counts: {
      vehicles: d._count.vehicles,
      leads: d._count.leads,
      sales: d._count.sales,
      customers: d._count.customers,
    },
  }));

  const summary: PlatformSummary = {
    total: accounts.length,
    trial: accounts.filter((a) => a.subscriptionStatus === "trial").length,
    active: accounts.filter((a) => a.subscriptionStatus === "active").length,
    expired: accounts.filter((a) => a.subscriptionStatus === "expired").length,
    suspended: accounts.filter((a) => a.subscriptionStatus === "suspended").length,
  };

  return { accounts, summary };
}
