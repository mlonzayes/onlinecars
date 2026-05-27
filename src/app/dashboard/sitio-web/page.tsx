import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WebsiteSettings } from "@/components/dashboard/settings/website-settings";
import { SectionsBuilderClient } from "@/components/dashboard/sections-builder/sections-builder-client";
import { getSectionsPageData } from "./sections-page-data";
import type { DealershipTheme } from "@/types";

export default async function SitioWebPage() {
  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/onboarding");

  const theme = dealership.theme as DealershipTheme | null;

  const [reviews, sectionsData] = await Promise.all([
    prisma.review.findMany({
      where: { dealershipId: dealership.id },
      orderBy: { createdAt: "desc" },
    }),
    getSectionsPageData(dealership.id, theme),
  ]);

  // Serializamos las dates de reviews ANTES de pasar al Client Component
  // (Next 15 no permite pasar Date objects al boundary server→client).
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
      <div>
        <h1 className="text-2xl font-bold">Sitio Web</h1>
        <p className="text-muted-foreground">Personalizá la apariencia y contenido de tu sitio público.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Secciones del sitio</CardTitle>
          <CardDescription>
            Activá, ordená y editá las secciones que se muestran en tu sitio público.
            Los paneles de marcas y opiniones ahora viven dentro del editor de
            sus respectivas secciones (botón &ldquo;Editar&rdquo;).
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
        dealership={dealership}
        theme={theme}
      />
    </div>
  );
}
