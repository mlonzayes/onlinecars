"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/blog-slug";
import { blogPostSchema, type BlogPostFormValues } from "@/lib/validators/blog-post";
import { BlogAiDraftPanel } from "./blog-ai-draft-panel";
import { BlogBodyField } from "./blog-body-field";
import { BlogExtrasFields } from "./blog-extras-fields";
import { BlogPublishCard } from "./blog-publish-card";
import { BlogSideCard } from "./blog-side-card";

interface BlogPostEditorProps {
  /** Sin id = nota nueva. */
  postId?: string;
  initialValues: BlogPostFormValues;
}

/** Saca filas vacías del resumen, las preguntas y las fuentes antes de validar. */
function normalize(v: BlogPostFormValues): BlogPostFormValues {
  return {
    ...v,
    tldr: v.tldr.map((t) => t.trim()).filter(Boolean),
    faqs: v.faqs.filter((f) => f.question.trim() || f.answer.trim()),
    sources: v.sources.filter((s) => s.label.trim() || s.url.trim()),
  };
}

export function BlogPostEditor({ postId, initialValues }: BlogPostEditorProps) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  // Nota nueva: el slug sigue al título hasta que lo edites a mano.
  const [slugTouched, setSlugTouched] = useState(Boolean(postId));
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const onChange = (patch: Partial<BlogPostFormValues>) => setValues((prev) => ({ ...prev, ...patch }));

  async function save() {
    const parsed = blogPostSchema.safeParse(normalize(values));
    if (!parsed.success) {
      setErrors(parsed.error.issues.map((i) => i.message));
      toast.error("Revisá los campos marcados arriba");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      const res = await fetch(postId ? `/api/admin/blog/${postId}` : "/api/admin/blog", {
        method: postId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json: { error?: string } = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "No se pudo guardar");
        setSaving(false);
        return;
      }
      toast.success(postId ? "Nota guardada" : "Nota creada");
      // Sin setSaving(false) en el éxito: el push es asíncrono y el botón
      // quedaría habilitado mientras cambia de página.
      router.push("/admin/blog");
      router.refresh();
    } catch {
      toast.error("No se pudo guardar");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {errors.length > 0 && (
        <ul className="list-disc space-y-1 rounded-lg border border-destructive/30 bg-destructive/5 py-3 pl-8 pr-4 text-sm text-destructive">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <BlogAiDraftPanel
            hasContent={Boolean(values.title || values.body)}
            onDraft={(draft) => {
              onChange({ ...draft, slug: slugify(draft.slug || draft.title) });
              setSlugTouched(false);
            }}
          />

          <div className="space-y-1.5">
            <Label htmlFor="blog-title">Título *</Label>
            <Input
              id="blog-title"
              value={values.title}
              onChange={(e) =>
                onChange({ title: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })
              }
              placeholder="La frase que buscaría un dueño de agencia en Google"
            />
            <p className="text-xs text-muted-foreground">{values.title.length}/65 caracteres recomendados</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="blog-slug">URL *</Label>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>/blog/</span>
              <Input
                id="blog-slug"
                value={values.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  onChange({ slug: e.target.value });
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="blog-excerpt">Bajada *</Label>
            <Textarea
              id="blog-excerpt"
              rows={2}
              value={values.excerpt}
              onChange={(e) => onChange({ excerpt: e.target.value })}
              placeholder="1 o 2 frases. Es la descripción que muestra Google."
            />
          </div>

          <BlogBodyField values={values} onChange={onChange} />
          <BlogExtrasFields values={values} onChange={onChange} />
        </div>

        <aside className="space-y-4">
          <BlogPublishCard values={values} onChange={onChange} />
          <BlogSideCard values={values} onChange={onChange} />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={save} disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href="/admin/blog" />}>
              Cancelar
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
