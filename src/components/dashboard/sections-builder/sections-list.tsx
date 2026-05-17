"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDragReorder } from "@/hooks/use-drag-reorder";
import type { SectionType } from "@/lib/constants";
import type { TenantHomeBundleSection, TenantHomeBundleMedia } from "@/lib/tenant";
import { SectionRow } from "./section-row";

interface SectionsListProps {
  sections: TenantHomeBundleSection[];
  media: TenantHomeBundleMedia[];
  onSectionsChange: (sections: TenantHomeBundleSection[]) => void;
  onEditSection: (type: SectionType) => void;
}

export function SectionsList({
  sections,
  media,
  onSectionsChange,
  onEditSection,
}: SectionsListProps) {
  const [togglingType, setTogglingType] = useState<SectionType | null>(null);

  // Counts de media por section (no por purpose). Solo a fines de UI — el conteo
  // de la galería es el más significativo, pero mostramos todo lo que haya.
  const mediaCountBySection = useMemo(() => {
    const counts = {} as Record<SectionType, number>;
    for (const m of media) {
      // El sectionType viene en cada TenantHomeBundleMedia "extendido" (GET /sections incluye sectionType).
      const sectionType = (m as TenantHomeBundleMedia & { sectionType?: SectionType }).sectionType;
      if (!sectionType) continue;
      counts[sectionType] = (counts[sectionType] ?? 0) + 1;
    }
    return counts;
  }, [media]);

  // Reorder optimista con rollback en error.
  const handleReorder = useCallback(
    async (next: TenantHomeBundleSection[]) => {
      const previous = sections;
      // Optimistic: reasignamos order localmente (1-based como en backend).
      const optimistic = next.map((s, i) => ({ ...s, order: i + 1 }));
      onSectionsChange(optimistic);

      try {
        const res = await fetch("/api/concesionario/sections/order", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: optimistic.map((s) => s.type) }),
        });
        if (!res.ok) throw new Error("Failed");
        const json = (await res.json()) as { data: { sections: TenantHomeBundleSection[] } };
        onSectionsChange(json.data.sections);
      } catch {
        toast.error("No se pudo guardar el orden de las secciones");
        onSectionsChange(previous);
      }
    },
    [sections, onSectionsChange]
  );

  const { draggingId, dragOverId, getHandlers } = useDragReorder(sections, (next) => {
    void handleReorder(next);
  });

  async function handleToggleEnabled(section: TenantHomeBundleSection, next: boolean) {
    if (section.type === "catalog") return;
    setTogglingType(section.type);

    // Optimistic update.
    const previous = sections;
    onSectionsChange(sections.map((s) => (s.type === section.type ? { ...s, enabled: next } : s)));

    try {
      const res = await fetch(`/api/concesionario/sections/${section.type}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) throw new Error("Failed");
      const json = (await res.json()) as { data: { section: TenantHomeBundleSection } };
      onSectionsChange(
        sections.map((s) => (s.type === section.type ? json.data.section : s))
      );
      toast.success(next ? "Sección activada" : "Sección desactivada", { duration: 1500 });
    } catch {
      toast.error("No se pudo actualizar la sección");
      onSectionsChange(previous);
    } finally {
      setTogglingType(null);
    }
  }

  return (
    <div className="space-y-2">
      {sections.map((section) => (
        <SectionRow
          key={section.id}
          section={section}
          mediaCount={mediaCountBySection[section.type] ?? 0}
          isCatalogLocked={section.type === "catalog"}
          isDragging={draggingId === section.id}
          isDragOver={dragOverId === section.id}
          isToggling={togglingType === section.type}
          onEdit={() => onEditSection(section.type)}
          onToggleEnabled={(next) => handleToggleEnabled(section, next)}
          dragHandlers={getHandlers(section.id)}
        />
      ))}
    </div>
  );
}
