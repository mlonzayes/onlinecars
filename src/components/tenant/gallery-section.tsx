import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { Section } from "./section";
import type {
  TenantHomeBundleMedia,
  TenantHomeBundleSection,
} from "@/lib/tenant";
import type { GalleryConfig } from "@/lib/sections/config-types";

interface GallerySectionProps {
  section: TenantHomeBundleSection;
  // Items con purpose: gallery_image (varias permitidas).
  media: TenantHomeBundleMedia[];
}

const COLUMNS_CLASS: Record<2 | 3 | 4, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
};

// Sección "Galería" / "Nuestras instalaciones". Por ahora solo soporta layout grid.
// TODO: layout "masonry" — pendiente; por ahora cae a grid si llega "masonry".
export function GallerySection({ section, media }: GallerySectionProps) {
  const config = section.config as GalleryConfig;
  const galleryImages = media
    .filter((m) => m.purpose === "gallery_image")
    .sort((a, b) => a.order - b.order);

  if (galleryImages.length === 0) {
    return (
      <Section
        background="muted"
        id="galeria"
        eyebrow="Galería"
        title={section.title}
        description={section.subtitle ?? undefined}
      >
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
          <ImageIcon className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">
            Aún no hay imágenes en la galería
          </p>
          <p className="mt-1 text-xs text-slate-500">
            El concesionario subirá fotos de sus instalaciones próximamente.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section
      background="muted"
      id="galeria"
      eyebrow="Galería"
      title={section.title}
      description={section.subtitle ?? undefined}
    >
      <div className={`grid gap-3 sm:gap-4 ${COLUMNS_CLASS[config.columns]}`}>
        {galleryImages.map((image) => (
          <div
            key={image.id}
            className="relative aspect-square overflow-hidden rounded-xl bg-slate-100 shadow-sm transition-shadow hover:shadow-md"
          >
            <Image
              src={image.url}
              alt={section.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </Section>
  );
}
