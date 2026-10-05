import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import type { Dealership } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentDealership } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/super-admin";
import { getTenantHomeBundleForPreview, getTenantBasePath } from "@/lib/tenant";
import { TenantChrome } from "@/components/tenant/tenant-chrome";
import { TenantHomeContent } from "@/components/tenant/tenant-home-content";

// No indexable — es una vista privada del dueño.
export const metadata: Metadata = {
  title: "Vista previa del sitio",
  robots: { index: false, follow: false },
};

interface VistaPreviaPageProps {
  // ?dealership={id} → preview de OTRA cuenta. Solo lo honra un super-admin;
  // para cualquier otro usuario el param se ignora y ve su propio sitio.
  searchParams: Promise<{ dealership?: string }>;
}

/**
 * Resuelve de qué concesionario mostrar la preview.
 *
 * Caso normal: el dealership del usuario logueado.
 * Caso plataforma: el super-admin pasa ?dealership={id} para revisar el sitio de
 * un cliente antes de activárselo desde /admin/sitios. Es SOLO LECTURA del sitio
 * público — no da acceso a nada del panel del cliente.
 */
async function resolvePreviewTarget(
  userId: string,
  requestedId: string | undefined
): Promise<{ dealership: Dealership | null; asPlatform: boolean }> {
  if (requestedId && isSuperAdmin(userId)) {
    const dealership = await prisma.dealership.findUnique({ where: { id: requestedId } });
    return { dealership, asPlatform: true };
  }
  return { dealership: await getCurrentDealership(), asPlatform: false };
}

export default async function VistaPreviaPage({ searchParams }: VistaPreviaPageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { dealership: requestedId } = await searchParams;
  const { dealership, asPlatform } = await resolvePreviewTarget(userId, requestedId);

  // Sin dealership propio → el usuario todavía no completó el onboarding. Si
  // vino como plataforma y el id no existe, no lo mandamos al onboarding.
  if (!dealership) {
    if (asPlatform) redirect("/admin/sitios");
    redirect("/onboarding");
  }

  // Bundle SIN gatear por siteEnabled: se puede ver el sitio antes de publicarlo.
  const bundle = await getTenantHomeBundleForPreview(dealership.slug);
  const basePath = await getTenantBasePath(dealership.slug);

  return (
    <>
      {bundle ? (
        <TenantChrome dealership={dealership} basePath={basePath}>
          <TenantHomeContent bundle={bundle} basePath={basePath} />
        </TenantChrome>
      ) : (
        <div className="flex min-h-screen items-center justify-center p-8 text-center text-sm text-muted-foreground">
          No se pudo cargar la vista previa del sitio.
        </div>
      )}

      {/* Barra fija de preview — fuera del tenant-scope, es UI del panel.
          En modo plataforma cambia de color y de copy para que no haya dudas de
          que estás mirando el sitio de OTRA cuenta. */}
      <div
        className={`fixed inset-x-0 bottom-0 z-[100] flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-white shadow-lg ${
          asPlatform ? "bg-violet-700" : "bg-blue-600"
        }`}
      >
        <span className="min-w-0 truncate">
          <strong className="font-semibold">Vista previa</strong>
          {asPlatform ? ` — sitio de ${dealership.name}. ` : " — así se verá tu sitio. "}
          {dealership.siteEnabled ? "Ya está publicado." : "Todavía no está publicado."}
        </span>
        <Link
          href={asPlatform ? "/admin/sitios" : "/dashboard/sitio-web"}
          className="shrink-0 rounded-md bg-white/15 px-3 py-1 font-medium transition hover:bg-white/25"
        >
          {asPlatform ? "Volver al panel de plataforma" : "Volver al panel"}
        </Link>
      </div>
    </>
  );
}
