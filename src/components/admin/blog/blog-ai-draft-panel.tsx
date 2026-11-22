"use client";

import { useState } from "react";
import { SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BlogPostFormValues } from "@/lib/validators/blog-post";

type Draft = Pick<BlogPostFormValues, "title" | "slug" | "excerpt" | "category" | "tldr" | "body" | "faqs">;

interface BlogAiDraftPanelProps {
  /** true si el editor ya tiene texto: el borrador lo reemplazaría. */
  hasContent: boolean;
  onDraft: (draft: Draft) => void;
}

/**
 * Pide a la IA un borrador a partir de un tema. Llena el editor como borrador;
 * nada se publica sin revisión. Las notas ("Datos y enfoque") son lo que hace
 * que la nota tenga algo propio: sin datos reales, la IA deja [DATO: …].
 */
export function BlogAiDraftPanel({ hasContent, onDraft }: BlogAiDraftPanelProps) {
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function generate() {
    if (topic.trim().length < 5) {
      toast.error("Escribí el tema de la nota");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, notes: notes.trim() || undefined }),
      });
      const json: { data?: Draft; error?: string } = await res.json();
      if (!res.ok || !json.data) {
        toast.error(json.error ?? "No se pudo generar el borrador");
        return;
      }
      onDraft(json.data);
      toast.success("Borrador listo", { description: "Revisalo y completá los [DATO: …] antes de publicar." });
    } catch {
      toast.error("No se pudo generar el borrador");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-dashed bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <SparklesIcon className="size-4" /> Borrador con IA
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ai-topic">Tema</Label>
        <Input
          id="ai-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Ej: cuánto cuesta publicar autos en Mercado Libre para una agencia"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ai-notes">Datos y enfoque</Label>
        <Textarea
          id="ai-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Lo que sabés del tema: números reales, experiencia con clientes, a quién va dirigida."
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={() => (hasContent ? setConfirmOpen(true) : void generate())}
        >
          {loading ? "Escribiendo… (hasta 1 minuto)" : "Generar borrador"}
        </Button>
        {hasContent && (
          <p className="text-xs text-muted-foreground">Reemplaza el título, la bajada, el cuerpo, el resumen y las preguntas.</p>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Reemplazar lo que escribiste"
        description="El borrador pisa el título, la bajada, el cuerpo, el resumen y las preguntas que tenés ahora."
        confirmLabel="Generar igual"
        onConfirm={async () => {
          setConfirmOpen(false);
          await generate();
        }}
      />
    </div>
  );
}
