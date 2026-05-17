import { Section } from "./section";
import { CategoriesGrid } from "./categories-grid";
import { FeaturedTabs } from "./featured-tabs";
import { BrandsGrid } from "./brands-grid";
import { DualCTA } from "./dual-cta";
import { WhyChooseUs } from "./why-choose-us";
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
  const { vehicles, displayBrands } = bundle;

  return (
    <>
      {/* Categorías por tipo de carrocería */}
      <Section
        background="white"
        eyebrow="Explorá por tipo"
        title="Categorías"
        description="Filtrá rápido por el tipo de vehículo que buscás."
      >
        <CategoriesGrid basePath={basePath} />
      </Section>

      {/* Vehículos destacados con tabs — usa copy de la sección */}
      {vehicles.length > 0 && (
        <Section
          background="muted"
          eyebrow="Lo último en stock"
          title={section.title}
          description={section.subtitle ?? undefined}
        >
          <FeaturedTabs vehicles={vehicles} basePath={basePath} />
        </Section>
      )}

      {/* Marcas que trabajamos */}
      {displayBrands.length > 0 && (
        <Section
          background="white"
          eyebrow="Trabajamos con las mejores"
          title="Marcas premium"
          description="Acceso directo a las marcas más buscadas del mercado."
        >
          <BrandsGrid brands={displayBrands} basePath={basePath} />
        </Section>
      )}

      {/* Doble CTA: comprar (catálogo) o vender (cotización) */}
      <Section background="white" padding="tight">
        <DualCTA basePath={basePath} />
      </Section>

      {/* Why Choose Us */}
      <Section
        background="muted"
        eyebrow="Por qué elegirnos"
        title="Cuidamos cada detalle"
        description="No vendemos solo autos. Acompañamos toda la operación."
      >
        <WhyChooseUs />
      </Section>
    </>
  );
}
