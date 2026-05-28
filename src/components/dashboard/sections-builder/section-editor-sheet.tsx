"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SECTION_TYPE_LABELS,
  type SectionType,
} from "@/lib/constants";
import type {
  TenantHomeBundleMedia,
  TenantHomeBundleSection,
} from "@/lib/tenant";
import type { SectionConfigByType } from "@/lib/sections/config-types";
import { SectionTextFields } from "./section-text-fields";
import { SectionConfigControls } from "./section-config-controls";
import { MediaUploader } from "./media-uploader";
import { GalleryGrid } from "./gallery-grid";
import { BrandsSettings } from "@/components/dashboard/settings/brands-settings";
import { ReviewsSettings, type ReviewData } from "@/components/dashboard/settings/reviews-settings";
import type { DealershipTheme } from "@/types";

type SectionMedia = TenantHomeBundleMedia & { sectionType: SectionType };

interface SectionEditorSheetProps {
  section: TenantHomeBundleSection | null;
  media: SectionMedia[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (section: TenantHomeBundleSection) => void;
  onMediaUploaded: (media: SectionMedia) => void;
  onMediaDeleted: (id: string) => void;
  onMediaReordered: (media: SectionMedia[]) => void;
  // Data extra para paneles in-sheet específicos por tipo de sección:
  //  - theme: el panel de marcas oficiales (section.type === "brands")
  //  - reviews: el panel de moderación de opiniones (section.type === "reviews")
  // Si la sección que se edita NO es de esos tipos, estos props se ignoran.
  theme?: DealershipTheme | null;
  // Callback para que el padre actualice su state de theme tras un save.
  // Sin esto, reabrir el sheet leería el theme STALE del primer render del server.
  onThemeChange?: (theme: DealershipTheme | null) => void;
  reviews?: ReviewData[];
}

interface PatchBody {
  title?: string | null;
  subtitle?: string | null;
  content?: string | null;
  config?: SectionConfigByType[SectionType];
}

export function SectionEditorSheet({
  section,
  media,
  open,
  onOpenChange,
  onSaved,
  onMediaUploaded,
  onMediaDeleted,
  onMediaReordered,
  theme,
  onThemeChange,
  reviews,
}: SectionEditorSheetProps) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [config, setConfig] = useState<SectionConfigByType[SectionType] | null>(null);
  const [saving, setSaving] = useState(false);
  // Estado de marcas seleccionadas — solo aplica cuando section.type === "brands".
  // Se inicializa desde theme.selectedBrandIds al abrir el sheet.
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);

  // Reset form when the section being edited changes.
  useEffect(() => {
    if (!section) return;
    setTitle(section.title ?? "");
    setSubtitle(section.subtitle ?? "");
    setContent(section.content ?? "");
    setConfig(section.config);
    // Refrescamos las marcas seleccionadas también — relevante solo para la sección
    // brands, pero leemos del theme siempre por simplicidad (es solo memoria).
    setSelectedBrandIds(theme?.selectedBrandIds ?? []);
  }, [section, theme]);

  if (!section) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent />
      </Sheet>
    );
  }

  const mediaForThisSection = media.filter((m) => m.sectionType === section.type);
  const heroImage = mediaForThisSection.find((m) => m.purpose === "hero_image") ?? null;
  const heroVideo = mediaForThisSection.find((m) => m.purpose === "hero_video") ?? null;
  const aboutImage = mediaForThisSection.find((m) => m.purpose === "about_image") ?? null;
  const galleryItems = mediaForThisSection
    .filter((m) => m.purpose === "gallery_image")
    .sort((a, b) => a.order - b.order);

  async function handleSave() {
    if (!section) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("El título no puede estar vacío");
      return;
    }

    const body: PatchBody = {};
    body.title = trimmedTitle;
    body.subtitle = subtitle.trim() || null;
    body.content = content.trim() || null;
    if (config) body.config = config;

    setSaving(true);
    try {
      // 1. Guardar la metadata de la sección (título, subtítulo, config)
      const res = await fetch(`/api/concesionario/sections/${section.type}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errBody?.error ?? "No se pudo guardar la sección");
      }
      const json = (await res.json()) as { data: TenantHomeBundleSection };

      // 2. Si la sección es "brands", también persistimos las marcas oficiales
      //    en theme.selectedBrandIds. Es una segunda request a un endpoint
      //    distinto porque las marcas viven en theme, no en la sección.
      if (section.type === "brands") {
        const themeRes = await fetch("/api/concesionario/theme", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectedBrandIds }),
        });
        if (!themeRes.ok) {
          throw new Error("Sección guardada pero no se pudieron guardar las marcas");
        }
        // Notificar al padre con el theme actualizado (la response del endpoint
        // contiene el theme completo post-merge). Sin este paso, el theme prop
        // queda stale y los checkboxes vuelven a aparecer destildados al reabrir.
        const themeJson = (await themeRes.json()) as { data: { theme: DealershipTheme | null } };
        onThemeChange?.(themeJson.data.theme);
      }

      onSaved(json.data);
      toast.success(section.type === "brands" ? "Sección y marcas actualizadas" : "Sección actualizada");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  // Convierte un media nuevo en SectionMedia (suma el sectionType de la sección actual).
  function bindSectionType(m: TenantHomeBundleMedia & { sectionType: SectionType }): SectionMedia {
    return { ...m, sectionType: m.sectionType };
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Editar sección · {SECTION_TYPE_LABELS[section.type]}</SheetTitle>
          <SheetDescription>
            Cambios visibles en el sitio público después de guardar.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 px-4 py-2">
          <SectionTextFields
            type={section.type}
            title={title}
            subtitle={subtitle}
            content={content}
            onTitleChange={setTitle}
            onSubtitleChange={setSubtitle}
            onContentChange={setContent}
          />

          {config !== null && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Opciones de visualización</h3>
                <SectionConfigControls
                  type={section.type}
                  config={config}
                  onConfigChange={(next) => setConfig(next)}
                />
              </div>
            </>
          )}

          {section.type === "hero" && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Imagen / video de portada</h3>
                <MediaUploader
                  sectionType="hero"
                  purpose="hero_image"
                  current={heroImage}
                  onUploaded={(m) => onMediaUploaded(bindSectionType(m))}
                  onDeleted={onMediaDeleted}
                />
                <MediaUploader
                  sectionType="hero"
                  purpose="hero_video"
                  current={heroVideo}
                  onUploaded={(m) => onMediaUploaded(bindSectionType(m))}
                  onDeleted={onMediaDeleted}
                />
                <p className="text-xs text-muted-foreground">
                  Si subís un video, recomendamos también una imagen como respaldo.
                </p>
              </div>
            </>
          )}

          {section.type === "about" && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Imagen de la sección</h3>
                <MediaUploader
                  sectionType="about"
                  purpose="about_image"
                  current={aboutImage}
                  onUploaded={(m) => onMediaUploaded(bindSectionType(m))}
                  onDeleted={onMediaDeleted}
                />
              </div>
            </>
          )}

          {section.type === "gallery" && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Galería de fotos</h3>
                <GalleryGrid
                  items={galleryItems}
                  onUploaded={(m) => onMediaUploaded(bindSectionType(m))}
                  onDeleted={onMediaDeleted}
                  onReordered={(items) =>
                    onMediaReordered(items.map((m) => ({ ...m, sectionType: section.type })))
                  }
                />
              </div>
            </>
          )}

          {section.type === "brands" && (
            <>
              <Separator />
              <BrandsSettings
                selectedBrandIds={selectedBrandIds}
                onChange={setSelectedBrandIds}
              />
            </>
          )}

          {section.type === "reviews" && (
            <>
              <Separator />
              <ReviewsSettings initialReviews={reviews ?? []} />
            </>
          )}
        </div>

        <SheetFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </Button>
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
