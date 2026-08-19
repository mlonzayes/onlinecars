import { SectionRenderer } from "../section-renderer";
import { CollectionCarousel } from "../collection-carousel";
import { StockMarquee } from "./stock-marquee";
import { SpotlightSection } from "./spotlight-section";
import { StickySpecsSection } from "./sticky-specs-section";
import { isPremiumSlot, type TenantLayoutSlot } from "@/lib/tenant-templates";
import { CATALOG_CAROUSEL_KEY, type TenantHomeBundle, type TenantHomeBundleVehicle } from "@/lib/tenant";

interface PremiumLayoutProps {
  layout: readonly TenantLayoutSlot[];
  bundle: TenantHomeBundle;
  basePath: string;
}

/**
 * Elige los dos vehículos que protagonizan los bloques a sangre.
 *
 * Prioridad: destacados primero, después el resto — pero SIEMPRE con foto. Un
 * vehículo sin imagen no puede protagonizar un bloque de pantalla completa, y
 * los componentes se auto-ocultan si les llega uno así; filtrar acá evita que
 * el bloque desaparezca teniendo stock con fotos disponible.
 */
function pickHighlights(vehicles: TenantHomeBundleVehicle[]): {
  spotlight: TenantHomeBundleVehicle | null;
  sticky: TenantHomeBundleVehicle | null;
} {
  const withImages = vehicles.filter((v) => v.images.length > 0);
  const ordered = [
    ...withImages.filter((v) => v.featured),
    ...withImages.filter((v) => !v.featured),
  ];

  return {
    spotlight: ordered[0] ?? null,
    // El segundo, para no repetir el mismo auto en dos bloques seguidos.
    sticky: ordered[1] ?? null,
  };
}

/**
 * Render del home para plantillas con `layout` fijo (ver tenant-templates.ts).
 *
 * Recorre los slots declarados por la plantilla, en orden. Dos familias:
 *  - Slots premium: se alimentan del stock que ya viene en el bundle. Sin fila
 *    en DB, sin queries extra.
 *  - Slots que son SectionType: delegan en el SectionRenderer de siempre, con
 *    el contenido (título, subtítulo, config, media) que el dealer cargó.
 *
 * Sobre `enabled`: en un layout fijo la composición la decide la plantilla, así
 * que los bloques se fuerzan a enabled. Si el dealer apagó "reviews" en el
 * panel y después eligió esta plantilla, la sección igual aparece — es el trato
 * de una plantilla cerrada. Los bloques sin datos se auto-ocultan solos
 * (BrandsGrid, StockMarquee y los carruseles ya lo hacen).
 */
export function PremiumLayout({ layout, bundle, basePath }: PremiumLayoutProps) {
  const { spotlight, sticky } = pickHighlights(bundle.vehicles);
  const sectionByType = new Map(bundle.sections.map((s) => [s.type, s]));
  // El carrusel de pickups/SUVs se renderiza DENTRO del bloque catálogo, así
  // que se excluye de la tanda agrupada para no duplicarlo.
  const pageCollections = bundle.collections.filter((c) => c.key !== CATALOG_CAROUSEL_KEY);

  return (
    <>
      {layout.map((slot) => {
        if (isPremiumSlot(slot)) {
          switch (slot) {
            case "stock-marquee":
              return (
                <StockMarquee
                  key={slot}
                  vehicles={bundle.vehicles}
                  basePath={basePath}
                />
              );

            case "spotlight":
              return spotlight ? (
                <SpotlightSection
                  key={slot}
                  vehicle={spotlight}
                  basePath={basePath}
                />
              ) : null;

            case "sticky-specs":
              return sticky ? (
                <StickySpecsSection
                  key={slot}
                  vehicle={sticky}
                  basePath={basePath}
                />
              ) : null;

            case "collections":
              return pageCollections.map((collection) => (
                <CollectionCarousel
                  key={`${slot}-${collection.key}`}
                  collection={collection}
                  basePath={basePath}
                  background="muted"
                />
              ));

            default: {
              // Exhaustiveness: sumar un PremiumSlot sin manejarlo rompe acá.
              const _exhaustive: never = slot;
              return _exhaustive;
            }
          }
        }

        const section = sectionByType.get(slot);
        if (!section) return null;

        return (
          <SectionRenderer
            key={section.id}
            section={{ ...section, enabled: true }}
            bundle={bundle}
            basePath={basePath}
          />
        );
      })}
    </>
  );
}
