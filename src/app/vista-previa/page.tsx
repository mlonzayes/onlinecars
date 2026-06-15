import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCurrentDealership } from "@/lib/auth";
import { getTenantHomeBundleForPreview, getTenantBasePath } from "@/lib/tenant";
import { TenantChrome } from "@/components/tenant/tenant-chrome";
import { TenantHomeContent } from "@/components/tenant/tenant-home-content";

// No indexable — es una vista privada del dueño.
export const metadata: Metadata = {
  title: "Vista previa del sitio",
  robots: { index: false, follow: false },
};

export default async function VistaPreviaPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/onboarding");

  // Bundle SIN gatear por siteEnabled: el dueño puede ver su sitio antes de publicarlo.
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
          No se pudo cargar la vista previa de tu sitio.
        </div>
      )}

      {/* Barra fija de preview — fuera del tenant-scope, es UI del panel. */}
      <div className="fixed inset-x-0 bottom-0 z-[100] flex items-center justify-between gap-3 bg-blue-600 px-4 py-2.5 text-sm text-white shadow-lg">
        <span className="min-w-0 truncate">
          <strong className="font-semibold">Vista previa</strong> — así se verá tu sitio.{" "}
          {dealership.siteEnabled
            ? "Ya está publicado."
            : "Todavía no está publicado."}
        </span>
        <Link
          href="/dashboard/sitio-web"
          className="shrink-0 rounded-md bg-white/15 px-3 py-1 font-medium transition hover:bg-white/25"
        >
          Volver al panel
        </Link>
      </div>
    </>
  );
}
