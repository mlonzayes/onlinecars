"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BlogFieldProps } from "./blog-editor-types";

/**
 * Resumen, preguntas frecuentes y fuentes. Los tres alimentan lo que más citan
 * los motores de IA: el resumen, el FAQPage del JSON-LD y las fuentes.
 */
export function BlogExtrasFields({ values, onChange }: BlogFieldProps) {
  const setFaq = (i: number, patch: Partial<{ question: string; answer: string }>) =>
    onChange({ faqs: values.faqs.map((f, j) => (j === i ? { ...f, ...patch } : f)) });
  const setSource = (i: number, patch: Partial<{ label: string; url: string }>) =>
    onChange({ sources: values.sources.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <Label htmlFor="blog-tldr">En resumen</Label>
        <Textarea
          id="blog-tldr"
          rows={4}
          value={values.tldr.join("\n")}
          onChange={(e) => onChange({ tldr: e.target.value.split("\n") })}
          placeholder="Un punto por línea. 2 a 4 frases que respondan la pregunta de la nota."
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Preguntas frecuentes</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => onChange({ faqs: [...values.faqs, { question: "", answer: "" }] })}>
            <PlusIcon /> Agregar
          </Button>
        </div>
        {values.faqs.map((faq, i) => (
          <div key={i} className="space-y-2 rounded-lg border p-3">
            <div className="flex gap-2">
              <Input placeholder="Pregunta" value={faq.question} onChange={(e) => setFaq(i, { question: e.target.value })} />
              <Button type="button" variant="ghost" size="icon" aria-label="Quitar pregunta" onClick={() => onChange({ faqs: values.faqs.filter((_, j) => j !== i) })}>
                <Trash2Icon />
              </Button>
            </div>
            <Textarea rows={2} placeholder="Respuesta de 1 a 3 frases" value={faq.answer} onChange={(e) => setFaq(i, { answer: e.target.value })} />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label>Fuentes</Label>
            <p className="text-xs text-muted-foreground">Solo las que consultaste de verdad.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => onChange({ sources: [...values.sources, { label: "", url: "" }] })}>
            <PlusIcon /> Agregar
          </Button>
        </div>
        {values.sources.map((source, i) => (
          <div key={i} className="flex gap-2">
            <Input placeholder="Nombre (ej. BCRA, cotización oficial)" value={source.label} onChange={(e) => setSource(i, { label: e.target.value })} />
            <Input placeholder="https://" type="url" value={source.url} onChange={(e) => setSource(i, { url: e.target.value })} />
            <Button type="button" variant="ghost" size="icon" aria-label="Quitar fuente" onClick={() => onChange({ sources: values.sources.filter((_, j) => j !== i) })}>
              <Trash2Icon />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
