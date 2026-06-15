import { Section } from "./section";
import { FeaturedTabs } from "./featured-tabs";
import { DualCTA } from "./dual-cta";
import { WhyChooseUs } from "./why-choose-us";
import { CollectionCarousel } from "./collection-carousel";
import { AnimateOnScroll } from "./animate-on-scroll";
import { CATALOG_CAROUSEL_KEY } from "@/lib/tenant";
import type {
  TenantHomeBundle,
  TenantHomeBundleSection,
} from "@/lib/tenant";

interface CatalogSectionProps {
  section: TenantHomeBundleSection;
  bundle: TenantHomeBundle;
  basePath: string;
}

// Sección "catálogo" del home: agrupa el bloque visual que antes vivía hardcoded
// en page.tsx (categorías → vehículos destacados → marcas → CTAs → por qué elegirnos).
// El título/subtítulo del bloque de destacados sale del DealershipSection.
export function CatalogSection({ section, bundle, basePath }: CatalogSectionProps) {
  const { vehicles } = bundle;
  // Carrusel que va entre la doble CTA y "por qué elegirnos" (si tiene stock).
  const slotCollection = bundle.collections.find((c) => c.key === CATALOG_CAROUSEL_KEY);

  return (
    <>
      {/* Categorías y Marcas son secciones independientes — ver `categories`
          y `brands` en section-renderer. El dealer las mueve / activa desde
          el sections-builder. Acá solo queda destacados + CTA + Why Choose.
          Las colecciones (0km, Usados, etc.) se intercalan a nivel page
          (ver tenant/[slug]/page.tsx), NO acá. */}
      {vehicles.length > 0 && (
        <Section
          background="muted"
          padding="tight"
          compactHeader
          eyebrow="Lo último en stock"
          title={section.title}
          description={section.subtitle ?? undefined}
        >
          <FeaturedTabs vehicles={vehicles} basePath={basePath} />
        </Section>
      )}

      {/* Doble CTA: comprar (catálogo) o vender (cotización) */}
      <Section background="white" padding="tight">
        <AnimateOnScroll preset="fadeUp">
          <DualCTA basePath={basePath} />
        </AnimateOnScroll>
      </Section>

      {/* Carrusel intercalado entre la doble CTA y "por qué elegirnos". */}
      {slotCollection && (
        <CollectionCarousel
          collection={slotCollection}
          basePath={basePath}
          background="muted"
        />
      )}

      {/* Why Choose Us */}
      <Section
        background="muted"
        eyebrow="Por qué elegirnos"
        title="Cuidamos cada detalle"
        description="No vendemos solo autos. Acompañamos toda la operación."
      >
        <AnimateOnScroll preset="stagger" staggerDelay={0.08}>
          <WhyChooseUs />
        </AnimateOnScroll>
      </Section>
    </>
  );
}
