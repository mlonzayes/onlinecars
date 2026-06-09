import Image from "next/image";
import { Section } from "./section";
import { AnimateOnScroll } from "./animate-on-scroll";
import type {
  TenantHomeBundleMedia,
  TenantHomeBundleSection,
} from "@/lib/tenant";
import type { AboutConfig } from "@/lib/sections/config-types";

interface AboutSectionProps {
  section: TenantHomeBundleSection;
  // Solo el media de la sección "about" (purpose: about_image, singleton).
  media: TenantHomeBundleMedia[];
}

// Sección "Sobre nosotros". Soporta tres layouts via config.layout.
// La imagen (si existe) es un singleton — about_image.
export function AboutSection({ section, media }: AboutSectionProps) {
  const config = section.config as AboutConfig;
  const aboutImage = media.find((m) => m.purpose === "about_image");
  const layout = config.layout;

  const textBlock = (
    <div className="space-y-4">
      {section.subtitle && (
        <p className="text-base font-medium text-[var(--tenant-fg-muted)] sm:text-lg">
          {section.subtitle}
        </p>
      )}
      {section.content && (
        <p className="whitespace-pre-line text-base leading-relaxed text-[var(--tenant-fg)]">
          {section.content}
        </p>
      )}
    </div>
  );

  const imageBlock = aboutImage ? (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[var(--tenant-surface-hover)] shadow-md">
      <Image
        src={aboutImage.url}
        alt={section.title}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-contain"
      />
    </div>
  ) : null;

  // text-only: una columna centrada. Con imagen: dos columnas con orden invertible.
  const showImage = layout !== "text-only" && imageBlock !== null;

  return (
    <Section
      background="white"
      id="nosotros"
      eyebrow="Sobre nosotros"
      title={section.title}
      align={showImage ? "left" : "center"}
    >
      <AnimateOnScroll preset="fadeUp">
        {showImage ? (
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {layout === "image-left" ? (
              <>
                {imageBlock}
                {textBlock}
              </>
            ) : (
              <>
                {textBlock}
                {imageBlock}
              </>
            )}
          </div>
        ) : (
          <div className="mx-auto max-w-3xl text-center">{textBlock}</div>
        )}
      </AnimateOnScroll>
    </Section>
  );
}
