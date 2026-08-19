import { SectionRenderer } from "./section-renderer";
import { CollectionCarousel } from "./collection-carousel";
import { PremiumLayout } from "./premium/premium-layout";
import { resolveTemplate } from "@/lib/tenant-templates";
import { CATALOG_CAROUSEL_KEY, type TenantHomeBundle } from "@/lib/tenant";

// Ancla de cada colección: se renderiza JUSTO DESPUÉS de la sección de ese type.
// "pickups_suv" va dentro del catálogo (ver CatalogSection), no acá.
const COLLECTION_ANCHOR: Record<string, string> = {
  nuevos: "catalog", // 0km entre "por qué elegirnos" y "marcas premium"
  usados: "brands", // entre "marcas premium" y la siguiente
  oportunidades: "about", // entre "sobre nosotros" y la siguiente
};

interface TenantHomeContentProps {
  bundle: TenantHomeBundle;
  basePath: string;
}

/**
 * Render del home del tenant: secciones configurables + carruseles de categoría
 * intercalados. Lo usan el sitio público (tenant/[slug]) y la vista previa del
 * panel — así el preview se ve idéntico al sitio real.
 */
export function TenantHomeContent({ bundle, basePath }: TenantHomeContentProps) {
  const { sections, collections } = bundle;

  // Plantillas con layout fijo (ej: "prestige") declaran su propia composición
  // y no usan el orden/enabled de la DB ni las anclas de colección de abajo.
  const template = resolveTemplate(bundle.dealership.templateId);
  if (template.layout) {
    return (
      <PremiumLayout layout={template.layout} bundle={bundle} basePath={basePath} />
    );
  }

  const pageCollections = collections.filter((c) => c.key !== CATALOG_CAROUSEL_KEY);
  const used = new Set<string>();
  const nodes: React.ReactNode[] = [];

  for (const section of sections) {
    nodes.push(
      <SectionRenderer
        key={section.id}
        section={section}
        bundle={bundle}
        basePath={basePath}
      />
    );
    for (const col of pageCollections) {
      if (COLLECTION_ANCHOR[col.key] === section.type && !used.has(col.key)) {
        nodes.push(
          <CollectionCarousel
            key={`col-${col.key}`}
            collection={col}
            basePath={basePath}
            background="white"
          />
        );
        used.add(col.key);
      }
    }
  }

  for (const col of pageCollections) {
    if (!used.has(col.key)) {
      nodes.push(
        <CollectionCarousel
          key={`col-${col.key}`}
          collection={col}
          basePath={basePath}
          background="white"
        />
      );
    }
  }

  return <>{nodes}</>;
}
