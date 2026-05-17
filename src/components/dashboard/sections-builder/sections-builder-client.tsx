"use client";

import { useCallback, useMemo, useState } from "react";
import type { SectionType } from "@/lib/constants";
import type {
  TenantHomeBundleMedia,
  TenantHomeBundleSection,
} from "@/lib/tenant";
import { SectionsList } from "./sections-list";
import { SectionEditorSheet } from "./section-editor-sheet";

type SectionMedia = TenantHomeBundleMedia & { sectionType: SectionType };

interface SectionsBuilderClientProps {
  initialSections: TenantHomeBundleSection[];
  initialMedia: SectionMedia[];
}

export function SectionsBuilderClient({
  initialSections,
  initialMedia,
}: SectionsBuilderClientProps) {
  const [sections, setSections] = useState(initialSections);
  const [media, setMedia] = useState(initialMedia);
  const [editingType, setEditingType] = useState<SectionType | null>(null);

  const editingSection = useMemo(
    () => sections.find((s) => s.type === editingType) ?? null,
    [sections, editingType]
  );

  const handleSectionSaved = useCallback((updated: TenantHomeBundleSection) => {
    setSections((prev) => prev.map((s) => (s.type === updated.type ? updated : s)));
  }, []);

  const handleMediaUploaded = useCallback((uploaded: SectionMedia) => {
    setMedia((prev) => {
      // Para singleton purposes, el backend reemplaza el anterior — limpiamos del estado local también.
      const isSingleton =
        uploaded.purpose === "hero_image" ||
        uploaded.purpose === "hero_video" ||
        uploaded.purpose === "about_image" ||
        uploaded.purpose === "section_image";
      if (isSingleton) {
        return [
          ...prev.filter(
            (m) =>
              !(m.sectionType === uploaded.sectionType && m.purpose === uploaded.purpose)
          ),
          uploaded,
        ];
      }
      return [...prev, uploaded];
    });
  }, []);

  const handleMediaDeleted = useCallback((id: string) => {
    setMedia((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const handleMediaReordered = useCallback((next: SectionMedia[]) => {
    setMedia((prev) => {
      const reorderedIds = new Set(next.map((m) => m.id));
      const untouched = prev.filter((m) => !reorderedIds.has(m.id));
      return [...untouched, ...next];
    });
  }, []);

  return (
    <>
      <SectionsList
        sections={sections}
        media={media}
        onSectionsChange={setSections}
        onEditSection={setEditingType}
      />
      <SectionEditorSheet
        section={editingSection}
        media={media}
        open={editingType !== null}
        onOpenChange={(open) => {
          if (!open) setEditingType(null);
        }}
        onSaved={handleSectionSaved}
        onMediaUploaded={handleMediaUploaded}
        onMediaDeleted={handleMediaDeleted}
        onMediaReordered={handleMediaReordered}
      />
    </>
  );
}
