import { HeroSearch } from "./hero-search";
import { AboutSection } from "./about-section";
import { CatalogSection } from "./catalog-section";
import { CategoriesGrid } from "./categories-grid";
import { BrandsGrid } from "./brands-grid";
import { GallerySection } from "./gallery-section";
import { FinancingSection } from "./financing-section";
import { ReviewsSection } from "./reviews-section";
import { ContactSection } from "./contact-section";
import { Section } from "./section";
import { AnimateOnScroll } from "./animate-on-scroll";
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

    case "categories":
      return (
        <Section
          background="white"
          eyebrow="Explorá por tipo"
          title={section.title || "Categorías"}
          description={section.subtitle ?? "Filtrá rápido por el tipo de vehículo que buscás."}
        >
          <AnimateOnScroll preset="stagger" staggerDelay={0.06}>
            <CategoriesGrid basePath={basePath} />
          </AnimateOnScroll>
        </Section>
      );

    case "about":
      return <AboutSection section={section} media={mediaBySection.about} />;

    case "catalog":
      return (
        <CatalogSection section={section} bundle={bundle} basePath={basePath} />
      );

    case "brands": {
      // Marcas oficiales + marcas en stock. Si no hay nada que mostrar, no
      // renderea la sección — evita un strip vacío en el home.
      const { displayBrands } = bundle;
      if (displayBrands.length === 0) return null;
      return (
        <Section
          background="white"
          eyebrow="Trabajamos con las mejores"
          title={section.title || "Marcas premium"}
          description={section.subtitle ?? "Acceso directo a las marcas más buscadas del mercado."}
        >
          <AnimateOnScroll preset="stagger" staggerDelay={0.05}>
            <BrandsGrid brands={displayBrands} basePath={basePath} />
          </AnimateOnScroll>
        </Section>
      );
    }

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
