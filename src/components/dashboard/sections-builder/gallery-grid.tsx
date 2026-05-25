"use client";

import { useRef, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ALLOWED_TENANT_IMAGE_MIME_TYPES,
  MAX_GALLERY_IMAGES,
  MAX_TENANT_IMAGE_BYTES,
  type MediaPurpose,
  type SectionType,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useDragReorder } from "@/hooks/use-drag-reorder";
import type { TenantHomeBundleMedia } from "@/lib/tenant";

interface GalleryGridProps {
  items: TenantHomeBundleMedia[];
  onUploaded: (m: TenantHomeBundleMedia & { sectionType: SectionType }) => void;
  onDeleted: (id: string) => void;
  onReordered: (items: TenantHomeBundleMedia[]) => void;
}

export function GalleryGrid({
  items,
  onUploaded,
  onDeleted,
  onReordered,
}: GalleryGridProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const maxMb = MAX_TENANT_IMAGE_BYTES / 1024 / 1024;
  const remaining = MAX_GALLERY_IMAGES - items.length - uploading;
  const isFull = remaining <= 0;

  async function persistOrder(next: TenantHomeBundleMedia[]) {
    const previous = items;
    onReordered(next);
    try {
      const res = await fetch("/api/concesionario/media/order", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((i) => i.id) }),
      });
      if (!res.ok) throw new Error("Failed");
      const json = (await res.json()) as {
        data: { media: TenantHomeBundleMedia[] };
      };
      onReordered(json.data.media);
    } catch {
      toast.error("No se pudo guardar el orden");
      onReordered(previous);
    }
  }

  const { draggingId, dragOverId, getHandlers } = useDragReorder(items, (next) => {
    void persistOrder(next);
  });

  async function uploadOne(file: File): Promise<void> {
    if (!(ALLOWED_TENANT_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
      toast.error(`"${file.name}": formato no permitido.`);
      return;
    }
    if (file.size > MAX_TENANT_IMAGE_BYTES) {
      toast.error(`"${file.name}": demasiado grande (máx ${maxMb}MB).`);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sectionType", "gallery");
    formData.append("purpose", "gallery_image");

    const res = await fetch("/api/concesionario/media", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(data.error ?? `Falló la subida de "${file.name}"`);
      return;
    }

    const json = (await res.json()) as {
      data: {
        id: string;
        purpose: MediaPurpose;
        sectionType: SectionType;
        url: string;
        mimeType: string;
        order: number;
      };
    };
    onUploaded({
      id: json.data.id,
      purpose: json.data.purpose,
      sectionType: json.data.sectionType,
      url: json.data.url,
      mimeType: json.data.mimeType,
      order: json.data.order,
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    if (arr.length > remaining) {
      toast.error(
        `Solo podés subir ${Math.max(0, remaining)} imágenes más (máx ${MAX_GALLERY_IMAGES}).`
      );
      return;
    }

    setUploading((n) => n + arr.length);
    for (const file of arr) {
      try {
        await uploadOne(file);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    void handleFiles(event.target.files);
    event.target.value = "";
  }

  async function handleDeleteConfirmed() {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/concesionario/media/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("No se pudo eliminar la imagen");
        return;
      }
      onDeleted(id);
      toast.success("Imagen eliminada", { duration: 1500 });
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} / {MAX_GALLERY_IMAGES} imágenes
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TENANT_IMAGE_MIME_TYPES.join(",")}
          multiple
          onChange={handleInputChange}
          className="hidden"
          disabled={isFull}
        />
        <Button
          type="button"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isFull}
          title={isFull ? `Máximo ${MAX_GALLERY_IMAGES} imágenes` : undefined}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Agregar imagen
        </Button>
      </div>

      {items.length === 0 && uploading === 0 ? (
        <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          Sin imágenes todavía.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((m) => {
            const handlers = getHandlers(m.id);
            const isDragging = draggingId === m.id;
            const isDragOver = dragOverId === m.id;
            return (
              <div
                key={m.id}
                {...handlers}
                className={cn(
                  "group relative aspect-square cursor-move overflow-hidden rounded-md border bg-muted",
                  isDragging && "opacity-40",
                  isDragOver && "ring-2 ring-primary"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.url}
                  alt="Imagen de galería"
                  className="h-full w-full object-cover"
                  draggable={false}
                />
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(m.id)}
                  disabled={deletingId === m.id}
                  aria-label="Eliminar imagen"
                  className="absolute right-1.5 top-1.5 rounded bg-background/90 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                >
                  {deletingId === m.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            );
          })}
          {Array.from({ length: uploading }).map((_, i) => (
            <div
              key={`uploading-${i}`}
              className="flex aspect-square animate-pulse items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground"
            >
              Subiendo...
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Eliminar imagen"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  );
}
