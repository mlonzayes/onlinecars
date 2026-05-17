import { HeroSearch } from "./hero-search";
import { AboutSection } from "./about-section";
import { CatalogSection } from "./catalog-section";
import { GallerySection } from "./gallery-section";
import { FinancingSection } from "./financing-section";
import { ReviewsSection } from "./reviews-section";
import { ContactSection } from "./contact-section";
import type {
  TenantHomeBundle,
  TenantHomeBundleSection,
} from "@/lib/tenant";

interface SectionRendererProps {
  section: TenantHomeBundleSection;
  bundle: TenantHomeBundle;
  basePath: string;
}

// Dispatcher de secciones del home del tenant. Switch sobre section.type.
// El orden y enabled son enforced en el backend; el guard de enabled acá es
// defensivo (defense-in-depth).
export function SectionRenderer({ section, bundle, basePath }: SectionRendererProps) {
  if (!section.enabled) return null;

  const { dealership, reviews, mediaBySection } = bundle;
  const primaryColor = dealership.theme?.colorPrimary ?? "#2563eb";

  switch (section.type) {
    case "hero": {
      // Fallback legacy: si todavía existe theme.heroType/heroUrl y no hay media nueva,
      // HeroSearch los usa internamente (segundo nivel del fallback chain).
      return (
        <HeroSearch
          basePath={basePath}
          brands={bundle.stockBrands}
          primaryColor={primaryColor}
          section={section}
          media={mediaBySection.hero}
          heroType={dealership.theme?.heroType ?? "none"}
          heroUrl={dealership.theme?.heroUrl ?? null}
        />
      );
    }

    case "about":
      return <AboutSection section={section} media={mediaBySection.about} />;

    case "catalog":
      return (
        <CatalogSection section={section} bundle={bundle} basePath={basePath} />
      );

    case "gallery":
      return <GallerySection section={section} media={mediaBySection.gallery} />;

    case "financing":
      return <FinancingSection section={section} basePath={basePath} />;

    case "reviews":
      return (
        <ReviewsSection section={section} reviews={reviews} basePath={basePath} />
      );

    case "contact":
      return <ContactSection section={section} dealership={dealership} />;

    default: {
      // Exhaustiveness check: si se agrega un nuevo SectionType, TS rompe acá.
      const _exhaustive: never = section.type;
      return _exhaustive;
    }
  }
}
