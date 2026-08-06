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
  // --- Sitio público ---
  // Si false, {slug}.motorflowapp.com responde 404. Es el toggle que maneja el
  // dealer desde su panel y el super-admin desde /admin/sitios.
  siteEnabled: boolean;
  // Plantilla visual activa (ver TENANT_TEMPLATES).
  templateId: string;
  // Dominio propio del dealer (Fase 2). Si está cargado, el sitio se sirve
  // desde ahí y no desde el subdominio.
  website: string | null;
  // `active` = cuenta vigente. Es un gate distinto de siteEnabled y también
  // apaga el sitio público — lo mostramos para no diagnosticar mal un 404.
  active: boolean;
  trialEndsAt: string | null;
  // Días que faltan para que venza el trial. null si no está en trial / sin fecha.
  // Puede ser negativo si ya venció pero el cron todavía no lo marcó.
  trialDaysLeft: number | null;
  // Suscripción paga hasta (ISO). null = nunca pagó.
  paidUntil: string | null;
  // Días de atraso en el pago (positivo = debe hace N días). null si está al día o nunca pagó.
  overdueDays: number | null;
  createdAt: string;
  counts: { vehicles: number; leads: number; sales: number; customers: number };
}

export interface PlatformSummary {
  total: number;
  trial: number;
  active: number;
  expired: number;
  suspended: number;
  // Sitios efectivamente online. Requiere las DOS condiciones que chequea
  // getDealershipBySlug: cuenta activa Y sitio habilitado. Contar solo
  // siteEnabled mentiría sobre una cuenta dada de baja.
  sitesLive: number;
  sitesPaused: number;
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
      siteEnabled: true,
      templateId: true,
      website: true,
      active: true,
      trialEndsAt: true,
      paidUntil: true,
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
    siteEnabled: d.siteEnabled,
    templateId: d.templateId,
    website: d.website,
    active: d.active,
    trialEndsAt: d.trialEndsAt?.toISOString() ?? null,
    trialDaysLeft: d.trialEndsAt
      ? Math.ceil((d.trialEndsAt.getTime() - now) / 86_400_000)
      : null,
    paidUntil: d.paidUntil?.toISOString() ?? null,
    overdueDays:
      d.paidUntil && d.paidUntil.getTime() < now
        ? Math.floor((now - d.paidUntil.getTime()) / 86_400_000)
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
    sitesLive: accounts.filter((a) => a.siteEnabled && a.active).length,
    sitesPaused: accounts.filter((a) => !a.siteEnabled || !a.active).length,
  };

  return { accounts, summary };
}
