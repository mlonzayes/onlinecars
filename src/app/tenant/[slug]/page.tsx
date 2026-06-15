import { notFound } from "next/navigation";
import { getTenantHomeBundle, getTenantBasePath, CATALOG_CAROUSEL_KEY } from "@/lib/tenant";
import { SectionRenderer } from "@/components/tenant/section-renderer";
import { CollectionCarousel } from "@/components/tenant/collection-carousel";

interface TenantHomePageProps {
  params: Promise<{ slug: string }>;
}

// Ancla de cada colección: se renderiza JUSTO DESPUÉS de la sección de ese type.
// Determinístico y se adapta al orden real de las secciones del dealer.
// "pickups_suv" no está acá: va dentro del catálogo (ver CatalogSection).
const COLLECTION_ANCHOR: Record<string, string> = {
  // 0km justo después del catálogo (cuyo último bloque es "por qué elegirnos"),
  // o sea entre "por qué elegirnos" y "marcas premium". El catálogo siempre
  // existe, así que no cae al final (antes estaba anclado a "categories", que
  // este sitio no tiene → terminaba después del form).
  nuevos: "catalog",
  usados: "brands",      // entre "marcas premium" y la sección siguiente
  oportunidades: "about", // entre "sobre nosotros" y la siguiente
};

export default async function TenantHomePage({ params }: TenantHomePageProps) {
  const { slug } = await params;
  const bundle = await getTenantHomeBundle(slug);
  if (!bundle) notFound();

  const basePath = await getTenantBasePath(slug);
  const { sections, collections } = bundle;

  // El carrusel del catálogo lo renderiza CatalogSection; el resto se ancla acá.
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
    // Después de la sección, insertar las colecciones ancladas a su type.
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

  // Colecciones cuya sección-ancla no existe en este sitio → al final, para no perderlas.
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
