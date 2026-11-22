"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArticleBlocks } from "@/components/landing/article-blocks";
import type { BlogFieldProps } from "./blog-editor-types";

const HELP = [
  ["## Subtítulo", "sección (### para un sub-subtítulo)"],
  ["línea en blanco", "nuevo párrafo"],
  ["- item  /  1. item", "lista"],
  ["[texto](/precios)", "link interno (o https://… externo)"],
  ["**texto**", "negrita"],
] as const;

/**
 * Cuerpo de la nota en Markdown simple, con vista previa. La vista previa usa
 * el MISMO componente que la página pública: lo que ves es lo que se publica.
 */
export function BlogBodyField({ values, onChange }: BlogFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="blog-body">Cuerpo *</Label>
      <Tabs defaultValue="write">
        <TabsList>
          <TabsTrigger value="write">Escribir</TabsTrigger>
          <TabsTrigger value="preview">Vista previa</TabsTrigger>
        </TabsList>
        <TabsContent value="write" className="space-y-2">
          <Textarea
            id="blog-body"
            value={values.body}
            onChange={(e) => onChange({ body: e.target.value })}
            rows={24}
            className="font-mono text-sm leading-relaxed"
            placeholder={"## Primer subtítulo\n\nEl primer párrafo responde la pregunta del título…"}
          />
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {HELP.map(([syntax, meaning]) => (
              <li key={syntax}>
                <code className="rounded bg-muted px-1 py-0.5">{syntax}</code> {meaning}
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="preview">
          <div className="min-h-64 rounded-lg border bg-white p-6">
            {values.body.trim() ? (
              <ArticleBlocks markdown={values.body} />
            ) : (
              <p className="text-sm text-muted-foreground">Todavía no hay nada para mostrar.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
