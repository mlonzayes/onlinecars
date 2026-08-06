import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/super-admin";
import { getPlatformEditTargetId } from "@/lib/admin-context";
import { getSectionsPageData } from "@/app/dashboard/sitio-web/sections-page-data";
import { WebsiteSettings } from "@/components/dashboard/settings/website-settings";
import { TemplateSelector } from "@/components/dashboard/settings/template-selector";
import { SectionsBuilderClient } from "@/components/dashboard/sections-builder/sections-builder-client";
import { PlatformEditBanner } from "@/components/admin/platform-edit-banner";
import { PlatformEditActivate } from "@/components/admin/platform-edit-activate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DealershipTheme } from "@/types";

/**
 * Editor del sitio de un cliente (modo plataforma).
 *
 * Compone LOS MISMOS componentes que /dashboard/sitio-web. No hay lógica de
 * builder duplicada: los componentes son client-side y postean a
 * /api/concesionario/*, que resuelve el tenant destino vía la cookie del modo
 * plataforma (ver src/lib/admin-context.ts).
 *
 * ¿Por qué no reusar /dashboard/sitio-web directamente? El layout del dashboard
 * tiene tres gates que expulsan al super-admin antes de llegar: redirige a
 * /onboarding si no tiene concesionario propio, a /aceptar-terminos si no firmó
 * T&C, y a /cuenta-pausada si la cuenta está suspendida — que es justo cuando
 * más querrías entrar a armarle la web. Además el sidebar mostraría el nombre
 * del concesionario equivocado.
 */
export default async function AdminEditSitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!isSuperAdmin(userId)) notFound();

  const { id } = await params;

  const dealership = await prisma.dealership.findUnique({ where: { id } });
  if (!dealership) notFound();

  // El modo tiene que estar activo Y apuntando a ESTA cuenta. Si no, las
  // mutaciones del builder irían a otro tenant: mostramos la activación en vez
  // de renderizar un editor que escribe en el lugar equivocado.
  const activeTargetId = await getPlatformEditTargetId();
  if (activeTargetId !== id) {
    return (
      <div className="py-10">
        <PlatformEditActivate dealershipId={id} dealershipName={dealership.name} />
      </div>
    );
  }

  const theme = dealership.theme as DealershipTheme | null;

  const [reviews, sectionsData] = await Promise.all([
    prisma.review.findMany({
      where: { dealershipId: dealership.id },
      orderBy: { createdAt: "desc" },
    }),
    getSectionsPageData(dealership.id, theme),
  ]);

  // Next 15 no permite pasar Date al boundary server→client.
  const serializedReviews = reviews.map((r) => ({
    id: r.id,
    name: r.name,
    content: r.content,
    rating: r.rating,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <PlatformEditBanner dealershipName={dealership.name} slug={dealership.slug} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <Link
          href="/admin/sitios"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver a sitios
        </Link>
        <Link
          href={`/vista-previa?dealership=${dealership.id}`}
          target="_blank"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          <Eye className="size-4" />
          Vista previa
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Secciones del sitio</CardTitle>
          <CardDescription>
            Activá, ordená y editá las secciones que se muestran en el sitio público
            de este concesionario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SectionsBuilderClient
            initialSections={sectionsData.sections}
            initialMedia={sectionsData.media}
            theme={theme}
            reviews={serializedReviews}
          />
        </CardContent>
      </Card>

      <WebsiteSettings
        dealership={{
          slug: dealership.slug,
          logo: dealership.logo,
          favicon: dealership.favicon,
          website: dealership.website,
          siteEnabled: dealership.siteEnabled,
          announcement: dealership.announcement,
          templateId: dealership.templateId,
        }}
        theme={theme}
      />

      <TemplateSelector currentTemplateId={dealership.templateId} />
    </div>
  );
}
