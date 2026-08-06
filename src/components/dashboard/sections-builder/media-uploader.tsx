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

  type UploadedMedia = {
    id: string;
    purpose: MediaPurpose;
    sectionType: SectionType;
    url: string;
    mimeType: string;
    order: number;
  };

  /**
   * Camino tradicional: el archivo viaja en el body del POST.
   * Solo sirve para archivos chicos — en Vercel las funciones serverless cortan
   * el request body en 4.5MB. Se usa en dev (driver local) y como fallback.
   */
  async function uploadThroughServer(file: File): Promise<UploadedMedia> {
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
      throw new Error(data.error ?? "No se pudo subir el archivo");
    }
    const json = (await res.json()) as { data: UploadedMedia };
    return json.data;
  }

  /**
   * Subida directa browser → bucket. Tres pasos:
   *   1. Pedimos una URL firmada al servidor.
   *   2. PUT del archivo derecho al bucket (esto NO pasa por la función, así que
   *      el límite de 4.5MB no aplica).
   *   3. El servidor confirma: lee los bytes reales del bucket, valida tamaño y
   *      magic-number, y recién ahí crea la fila en DB.
   */
  async function uploadDirect(file: File): Promise<UploadedMedia> {
    const presignRes = await fetch("/api/concesionario/media/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionType,
        purpose,
        mimeType: file.type,
        sizeBytes: file.size,
      }),
    });
    if (!presignRes.ok) {
      const data = (await presignRes.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "No se pudo preparar la subida");
    }

    const presign = (await presignRes.json()) as {
      data: { mode: "s3"; uploadUrl: string; key: string } | { mode: "direct" };
    };

    // Driver local (dev): no hay bucket que firmar, va por el server.
    if (presign.data.mode === "direct") return uploadThroughServer(file);

    const { uploadUrl, key } = presign.data;

    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      // El Content-Type tiene que coincidir con el que se firmó o el bucket
      // rechaza la firma.
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!putRes.ok) {
      throw new Error("Falló la subida al servidor de archivos");
    }

    const confirmRes = await fetch("/api/concesionario/media/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionType, purpose, key }),
    });
    if (!confirmRes.ok) {
      const data = (await confirmRes.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "No se pudo registrar el archivo");
    }
    const json = (await confirmRes.json()) as { data: UploadedMedia };
    return json.data;
  }

  async function handleFile(file: File) {
    const validationError = validateClientSide(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploading(true);
    try {
      const media = await uploadDirect(file);
      onUploaded({
        id: media.id,
        purpose: media.purpose,
        sectionType: media.sectionType,
        url: media.url,
        mimeType: media.mimeType,
        order: media.order,
      });
      toast.success(current ? "Archivo reemplazado" : "Archivo subido", {
        duration: 1500,
      });
    } catch (error) {
      // El mensaje real del server llega hasta acá: antes cualquier fallo
      // mostraba un genérico y no se sabía si era tamaño, formato o red.
      toast.error(
        error instanceof Error ? error.message : "Error al subir el archivo"
      );
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
