import { Section } from "./section";
import { FeaturedTabs } from "./featured-tabs";
import type { TenantHomeCollection } from "@/lib/tenant";

interface CollectionCarouselProps {
  collection: TenantHomeCollection;
  basePath: string;
  background?: "white" | "muted";
}

// Un carrusel de categoría (0km, Usados, Pickups & SUVs, Oportunidades).
// Spacing reducido (tight + compactHeader) para no dejar tanto aire.
// Se renderiza intercalado a lo largo del home — ver tenant/[slug]/page.tsx.
export function CollectionCarousel({
  collection,
  basePath,
  background = "white",
}: CollectionCarouselProps) {
  return (
    <Section
      background={background}
      padding="tight"
      compactHeader
      eyebrow="Explorá"
      title={collection.label}
    >
      <FeaturedTabs vehicles={collection.vehicles} basePath={basePath} />
    </Section>
  );
}
