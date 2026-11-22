"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { POST_CATEGORIES, POST_CATEGORY_LABELS, type PostCategory } from "@/data/post-types";
import type { BlogFieldProps } from "./blog-editor-types";

const STATUS_LABELS = { draft: "Borrador", published: "Publicar" } as const;

/** "Ahora" en hora argentina, como valor de datetime-local. */
function nowArLocal(): string {
  const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 16);
}

/**
 * Estado y fecha de salida. "Publicar" con fecha futura = programada: la nota
 * aparece sola ese día (con hasta 1 hora de demora por la cache del sitio).
 */
export function BlogPublishCard({ values, onChange }: BlogFieldProps) {
  const isScheduled = values.status === "published" && values.publishAt !== null && values.publishAt > nowArLocal();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Publicación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Estado</Label>
          <Select
            value={values.status}
            onValueChange={(v) => {
              if (v !== "draft" && v !== "published") return;
              // Al pasar a publicar sin fecha, propone "ahora".
              onChange({ status: v, publishAt: v === "published" ? values.publishAt ?? nowArLocal() : values.publishAt });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue>{(v) => STATUS_LABELS[v as keyof typeof STATUS_LABELS]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Borrador</SelectItem>
              <SelectItem value="published">Publicar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="blog-publish-at">Fecha de salida (hora de Argentina)</Label>
          <Input
            id="blog-publish-at"
            type="datetime-local"
            value={values.publishAt ?? ""}
            onChange={(e) => onChange({ publishAt: e.target.value || null })}
          />
          <p className="text-xs text-muted-foreground">
            {isScheduled
              ? "Queda programada: sale sola ese día, con hasta 1 hora de demora."
              : "Con una fecha futura, la nota queda programada."}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Categoría</Label>
          <Select value={values.category} onValueChange={(v) => v && onChange({ category: v as PostCategory })}>
            <SelectTrigger className="w-full">
              <SelectValue>{(v) => POST_CATEGORY_LABELS[v as PostCategory] ?? String(v)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {POST_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {POST_CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="blog-updated-on">Actualizada el</Label>
          <Input
            id="blog-updated-on"
            type="date"
            value={values.contentUpdatedOn ?? ""}
            onChange={(e) => onChange({ contentUpdatedOn: e.target.value || null })}
          />
          <p className="text-xs text-muted-foreground">Solo si cambiaste el contenido de una nota ya publicada.</p>
        </div>
      </CardContent>
    </Card>
  );
}
