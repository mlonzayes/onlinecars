"use client";

import { useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ALLOWED_TENANT_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_HERO_VIDEO_BYTES,
  MAX_TENANT_IMAGE_BYTES,
  type MediaPurpose,
  type SectionType,
  type SingletonMediaPurpose,
} from "@/lib/constants";
import type { TenantHomeBundleMedia } from "@/lib/tenant";

interface MediaUploaderProps {
  sectionType: SectionType;
  purpose: SingletonMediaPurpose;
  current: TenantHomeBundleMedia | null;
  disabled?: boolean;
  onUploaded: (media: TenantHomeBundleMedia & { sectionType: SectionType }) => void;
  onDeleted: (id: string) => void;
}

// Singleton uploader: hero_image, hero_video, about_image, section_image.
// El backend reemplaza automáticamente el archivo previo en singleton purposes.
export function MediaUploader({
  sectionType,
  purpose,
  current,
  disabled = false,
  onUploaded,
  onDeleted,
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const isVideo = purpose === "hero_video";
  const acceptMimes = isVideo
    ? ALLOWED_VIDEO_MIME_TYPES
    : ALLOWED_TENANT_IMAGE_MIME_TYPES;
  const maxBytes = isVideo ? MAX_HERO_VIDEO_BYTES : MAX_TENANT_IMAGE_BYTES;
  const maxMb = maxBytes / 1024 / 1024;
  const formatsLabel = isVideo ? "MP4 o WebM" : "JPG, PNG o WebP";

  function validateClientSide(file: File): string | null {
    if (!(acceptMimes as readonly string[]).includes(file.type)) {
      return `Formato no permitido. Aceptamos ${formatsLabel}.`;
    }
    if (file.size > maxBytes) {
      return `El archivo es demasiado grande (máx ${maxMb}MB).`;
    }
    return null;
  }

  async function handleFile(file: File) {
    const validationError = validateClientSide(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sectionType", sectionType);
      formData.append("purpose", purpose);

      const res = await fetch("/api/concesionario/media", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "No se pudo subir el archivo");
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
      toast.success(current ? "Archivo reemplazado" : "Archivo subido", {
        duration: 1500,
      });
    } catch {
      toast.error("Error al subir el archivo");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!current) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/concesionario/media/${current.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("No se pudo eliminar");
        return;
      }
      onDeleted(current.id);
      toast.success("Archivo eliminado", { duration: 1500 });
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeleting(false);
      setConfirmDeleteOpen(false);
    }
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
    event.target.value = "";
  }

  return (
    <div className="space-y-3">
      {current ? (
        <div className="overflow-hidden rounded-lg border bg-muted">
          {isVideo ? (
            <video
              key={current.url}
              src={current.url}
              controls
              className="aspect-video w-full bg-black object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.url}
              alt="Vista previa"
              className="aspect-video w-full object-cover"
            />
          )}
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed bg-muted/30 text-xs text-muted-foreground">
          Sin archivo cargado.
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={acceptMimes.join(",")}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={current ? "outline" : "default"}
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {current ? "Reemplazar" : "Subir"}
            </>
          )}
        </Button>
        {current && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDeleteOpen(true)}
            disabled={disabled || deleting}
          >
            {deleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Eliminar
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Formatos: {formatsLabel} · máx {maxMb}MB
      </p>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Eliminar archivo"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  );
}
