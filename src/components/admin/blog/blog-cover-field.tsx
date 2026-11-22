"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { BlogFieldProps } from "./blog-editor-types";

/**
 * Portada de la nota: se sube al bucket público y se guarda la URL. Se muestra
 * con <img> y no con next/image: en el admin no hace falta optimizarla, y así
 * no depende de que el host del bucket esté en remotePatterns para previsualizar.
 */
export function BlogCoverField({ values, onChange }: BlogFieldProps) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/blog/cover", { method: "POST", body: form });
      const json: { data?: { url: string }; error?: string } = await res.json();
      if (!res.ok || !json.data) {
        toast.error(json.error ?? "No se pudo subir la imagen");
        return;
      }
      onChange({ coverImage: json.data.url });
    } catch {
      toast.error("No se pudo subir la imagen");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="blog-cover">Portada</Label>
      {values.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element -- vista previa en el admin
        <img src={values.coverImage} alt="" className="aspect-video w-full rounded-md border object-cover" />
      )}
      <input
        id="blog-cover"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
        className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm"
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {uploading ? "Subiendo…" : "JPG, PNG o WebP, hasta 5 MB. Ideal 1600×900."}
        </p>
        {values.coverImage && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ coverImage: null })}>
            Quitar
          </Button>
        )}
      </div>
    </div>
  );
}
