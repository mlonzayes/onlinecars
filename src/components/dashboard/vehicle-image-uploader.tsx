"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGES_PER_VEHICLE,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/constants";
import type { VehicleImage } from "@prisma/client";

interface VehicleImageUploaderProps {
  vehicleId: string;
  initialImages: VehicleImage[];
  // Si true, bloquea upload, delete y reorder. Usado cuando hay venta activa.
  disabled?: boolean;
}

export function VehicleImageUploader({
  vehicleId,
  initialImages,
  disabled = false,
}: VehicleImageUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<VehicleImage[]>(
    [...initialImages].sort((a, b) => a.order - b.order)
  );
  const [uploading, setUploading] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const remaining = MAX_IMAGES_PER_VEHICLE - images.length - uploading;
  const maxMb = MAX_IMAGE_SIZE_BYTES / 1024 / 1024;

  async function uploadOne(file: File): Promise<VehicleImage | null> {
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      toast.error(`"${file.name}": tipo no permitido (solo JPG, PNG, WebP).`);
      return null;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error(`"${file.name}": demasiado grande (max ${maxMb}MB).`);
      return null;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/vehiculos/${vehicleId}/images`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? `Falló la subida de "${file.name}"`);
      return null;
    }

    const { data } = (await res.json()) as { data: VehicleImage };
    return data;
  }

  async function handleFiles(files: FileList | null) {
    if (disabled) return;
    if (!files || files.length === 0) return;

    const arr = Array.from(files);
    if (arr.length > remaining) {
      toast.error(
        `Solo podés subir ${remaining} imágenes más (max ${MAX_IMAGES_PER_VEHICLE} por vehículo).`
      );
      return;
    }

    setUploading((n) => n + arr.length);
    for (const file of arr) {
      const created = await uploadOne(file);
      setUploading((n) => n - 1);
      if (created) {
        setImages((prev) => [...prev, created]);
      }
    }
    router.refresh();
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  async function handleDelete(imageId: string) {
    if (disabled) return;
    if (!confirm("¿Eliminar esta imagen? Esta acción no se puede deshacer.")) return;

    const res = await fetch(`/api/vehiculos/${vehicleId}/images/${imageId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      toast.error("No se pudo eliminar la imagen.");
      return;
    }

    setImages((prev) => prev.filter((img) => img.id !== imageId));
    toast.success("Imagen eliminada.");
    router.refresh();
  }

  async function persistOrder(newOrder: VehicleImage[]) {
    const res = await fetch(`/api/vehiculos/${vehicleId}/images/order`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: newOrder.map((i) => i.id) }),
    });

    if (!res.ok) {
      toast.error("No se pudo guardar el orden.");
      setImages([...initialImages].sort((a, b) => a.order - b.order));
      return;
    }
    router.refresh();
  }

  function handleReorderDrop(targetId: string) {
    if (disabled) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }
    const fromIdx = images.findIndex((i) => i.id === draggingId);
    const toIdx = images.findIndex((i) => i.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;

    const next = [...images];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);

    setImages(next);
    setDraggingId(null);
    setDragOverId(null);
    persistOrder(next);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          if (disabled) return;
          handleDrop(e);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          disabled
            ? "border-muted-foreground/15 bg-muted/30 opacity-60"
            : isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
      >
        <p className="text-sm font-medium">
          {disabled
            ? "Imágenes bloqueadas"
            : "Arrastrá imágenes acá o seleccionalas desde tu equipo"}
        </p>
        <p className="text-xs text-muted-foreground">
          JPG, PNG o WebP · máx {maxMb}MB cada una · {Math.max(0, remaining)} disponibles
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          multiple
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || remaining <= 0}
          className="mt-2"
        >
          Seleccionar archivos
        </Button>
      </div>

      {images.length === 0 && uploading === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Sin imágenes todavía. Subí al menos una.
        </p>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, idx) => (
            <div
              key={img.id}
              draggable={!disabled}
              onDragStart={() => !disabled && setDraggingId(img.id)}
              onDragEnd={() => {
                setDraggingId(null);
                setDragOverId(null);
              }}
              onDragOver={(e) => {
                if (disabled) return;
                e.preventDefault();
                if (draggingId && draggingId !== img.id) setDragOverId(img.id);
              }}
              onDrop={(e) => {
                if (disabled) return;
                e.preventDefault();
                handleReorderDrop(img.id);
              }}
              className={`group relative aspect-[4/3] overflow-hidden rounded-md border bg-muted ${
                disabled ? "" : "cursor-move"
              } ${draggingId === img.id ? "opacity-40" : ""} ${
                dragOverId === img.id ? "ring-2 ring-primary" : ""
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt ?? `Imagen ${idx + 1}`}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover"
              />
              {idx === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Principal
                </span>
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  className="absolute right-1.5 top-1.5 rounded bg-background/90 px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  aria-label="Eliminar imagen"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
          {Array.from({ length: uploading }).map((_, i) => (
            <div
              key={`uploading-${i}`}
              className="flex aspect-[4/3] animate-pulse items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground"
            >
              Subiendo...
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
