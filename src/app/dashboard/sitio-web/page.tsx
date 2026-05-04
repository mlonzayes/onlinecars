import { getCurrentDealership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WebsiteSettings } from "@/components/dashboard/settings/website-settings";
import { BrandsSettings } from "@/components/dashboard/settings/brands-settings";
import { ReviewsSettings } from "@/components/dashboard/settings/reviews-settings";
import type { DealershipTheme } from "@/types";

export default async function SitioWebPage() {
  const dealership = await getCurrentDealership();
  if (!dealership) redirect("/onboarding");

  const reviews = await prisma.review.findMany({
    where: { dealershipId: dealership.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sitio Web</h1>
        <p className="text-muted-foreground">Personalizá la apariencia y contenido de tu sitio público.</p>
      </div>
      <WebsiteSettings
        dealership={dealership}
        theme={dealership.theme as DealershipTheme | null}
      />
      <BrandsSettings theme={dealership.theme as DealershipTheme | null} />
      <ReviewsSettings
        initialReviews={reviews.map((r) => ({
          id: r.id,
          name: r.name,
          content: r.content,
          rating: r.rating,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
