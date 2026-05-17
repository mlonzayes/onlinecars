"use client";

import { GripVertical, Pencil, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SECTION_TYPE_LABELS } from "@/lib/constants";
import type { TenantHomeBundleSection } from "@/lib/tenant";
import type { DragReorderHandlers } from "@/hooks/use-drag-reorder";

interface SectionRowProps {
  section: TenantHomeBundleSection;
  mediaCount: number;
  isCatalogLocked: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  isToggling: boolean;
  onEdit: () => void;
  onToggleEnabled: (next: boolean) => Promise<void> | void;
  dragHandlers: DragReorderHandlers;
}

export function SectionRow({
  section,
  mediaCount,
  isCatalogLocked,
  isDragging,
  isDragOver,
  isToggling,
  onEdit,
  onToggleEnabled,
  dragHandlers,
}: SectionRowProps) {
  const label = SECTION_TYPE_LABELS[section.type];

  return (
    <div
      {...dragHandlers}
      className={cn(
        "group flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 transition-all",
        isDragging && "opacity-40",
        isDragOver && "ring-2 ring-primary"
      )}
    >
      <button
        type="button"
        aria-label="Mover sección"
        className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">{label}</p>
          {mediaCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              <ImageIcon className="h-3 w-3" />
              {mediaCount}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{section.title}</p>
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <span className={cn("inline-flex", isCatalogLocked && "cursor-not-allowed")} />
            }
          >
            <Switch
              checked={section.enabled}
              onCheckedChange={(next) => {
                if (isCatalogLocked) return;
                void onToggleEnabled(next);
              }}
              disabled={isCatalogLocked || isToggling}
              aria-label={section.enabled ? "Desactivar sección" : "Activar sección"}
            />
          </TooltipTrigger>
          {isCatalogLocked && (
            <TooltipContent>El catálogo siempre está visible</TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onEdit}
        className="gap-1.5"
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar
      </Button>
    </div>
  );
}
