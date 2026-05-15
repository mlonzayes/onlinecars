"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, ImageIcon, Loader2, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
  MAX_DOCUMENTS_PER_SALE,
  SALE_DOCUMENT_CATEGORIES,
  SALE_DOCUMENT_CATEGORY_LABELS,
  type SaleDocumentCategory,
} from "@/lib/constants";

// Tipo serializado (las fechas vienen como string ISO desde el server).
export interface SaleDocumentData {
  id: string;
  category: string;
  type: string;
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  notes: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  uploadedAt: string;
}

interface SaleDocumentsProps {
  saleId: string;
  initialDocuments: SaleDocumentData[];
}

interface FormState {
  category: SaleDocumentCategory;
  type: string;
  notes: string;
  issuedAt: string;
  expiresAt: string;
}

const INITIAL_FORM: FormState = {
  category: "customer",
  type: "",
  notes: "",
  issuedAt: "",
  expiresAt: "",
};

const TYPE_PLACEHOLDERS: Record<SaleDocumentCategory, string> = {
  customer: 'Ej: "DNI Frente", "Constancia de CUIT"',
  vehicle: 'Ej: "Título", "Cédula Verde", "VTV"',
  operation: 'Ej: "Boleto de reserva", "Factura", "Acta de entrega"',
};

const maxMb = MAX_DOCUMENT_SIZE_BYTES / 1024 / 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function isPdf(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

export function SaleDocuments({ saleId, initialDocuments }: SaleDocumentsProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<SaleDocumentData[]>(initialDocuments);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const remaining = MAX_DOCUMENTS_PER_SALE - documents.length;

  function handleField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      return;
    }
    if (!(ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(f.type)) {
      toast.error("Tipo no permitido. Solo PDF, JPG, PNG o WebP.");
      e.target.value = "";
      return;
    }
    if (f.size > MAX_DOCUMENT_SIZE_BYTES) {
      toast.error(`Archivo demasiado grande. Máximo ${maxMb}MB.`);
      e.target.value = "";
      return;
    }
    setFile(f);
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      toast.error("Seleccioná un archivo");
      return;
    }
    if (!form.type.trim()) {
      toast.error("Ingresá el tipo de documento");
      return;
    }
    if (remaining <= 0) {
      toast.error(`Máximo ${MAX_DOCUMENTS_PER_SALE} documentos por venta`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", form.category);
      formData.append("type", form.type.trim());
      if (form.notes.trim()) formData.append("notes", form.notes.trim());
      if (form.issuedAt) {
        formData.append("issuedAt", new Date(form.issuedAt).toISOString());
      }
      if (form.expiresAt) {
        formData.append("expiresAt", new Date(form.expiresAt).toISOString());
      }

      const res = await fetch(`/api/ventas/${saleId}/documentos`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Falló la subida");
        return;
      }

      const json = (await res.json()) as { data: SaleDocumentData };
      setDocuments((prev) => [json.data, ...prev]);
      resetForm();
      toast.success("Documento subido.");
      router.refresh();
    } catch {
      toast.error("Error de conexión.");
    } finally {
      setUploading(false);
    }
  }

  async function handleOpen(docId: string) {
    // Pre-abrir la pestaña dentro del handler del click — si la abrimos
    // después del await, el browser la bloquea como popup no solicitado.
    const target = window.open("", "_blank", "noopener,noreferrer");

    try {
      const res = await fetch(`/api/ventas/${saleId}/documentos/${docId}/url`);
      if (!res.ok) {
        target?.close();
        toast.error("No se pudo abrir el documento.");
        return;
      }
      const json = (await res.json()) as { data: { url: string } };
      if (target) {
        target.location.href = json.data.url;
      } else {
        window.location.href = json.data.url;
      }
    } catch {
      target?.close();
      toast.error("Error de conexión.");
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm("¿Eliminar este documento? Esta acción no se puede deshacer.")) {
      return;
    }

    const res = await fetch(`/api/ventas/${saleId}/documentos/${docId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      toast.error("No se pudo eliminar el documento.");
      return;
    }

    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    toast.success("Documento eliminado.");
    router.refresh();
  }

  // Agrupar documentos por categoría preservando el orden definido en SALE_DOCUMENT_CATEGORIES.
  const grouped = SALE_DOCUMENT_CATEGORIES.map((cat) => ({
    category: cat,
    label: SALE_DOCUMENT_CATEGORY_LABELS[cat],
    items: documents.filter((d) => d.category === cat),
  }));

  return (
    <div className="space-y-6">
      {/* Form de upload */}
      <form
        onSubmit={handleUpload}
        className="space-y-4 rounded-lg border bg-muted/30 p-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="doc-category">Categoría *</Label>
            <Select
              value={form.category}
              onValueChange={(v) => handleField("category", v as SaleDocumentCategory)}
            >
              <SelectTrigger id="doc-category" className="w-full">
                <SelectValue>{SALE_DOCUMENT_CATEGORY_LABELS[form.category]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SALE_DOCUMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {SALE_DOCUMENT_CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-type">Tipo de documento *</Label>
            <Input
              id="doc-type"
              value={form.type}
              onChange={(e) => handleField("type", e.target.value)}
              placeholder={TYPE_PLACEHOLDERS[form.category]}
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-issuedAt">Fecha de emisión</Label>
            <Input
              id="doc-issuedAt"
              type="date"
              value={form.issuedAt}
              onChange={(e) => handleField("issuedAt", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-expiresAt">Fecha de vencimiento</Label>
            <Input
              id="doc-expiresAt"
              type="date"
              value={form.expiresAt}
              onChange={(e) => handleField("expiresAt", e.target.value)}
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="doc-notes">Notas</Label>
            <Textarea
              id="doc-notes"
              value={form.notes}
              onChange={(e) => handleField("notes", e.target.value)}
              placeholder="Observaciones sobre el documento..."
              rows={2}
              maxLength={500}
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="doc-file">Archivo *</Label>
            <Input
              id="doc-file"
              ref={inputRef}
              type="file"
              accept={ALLOWED_DOCUMENT_TYPES.join(",")}
              onChange={handleFileChange}
              required
            />
            <p className="text-xs text-muted-foreground">
              PDF, JPG, PNG o WebP · máx {maxMb}MB · {Math.max(0, remaining)} disponibles
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={uploading || !file || remaining <= 0}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              "Subir documento"
            )}
          </Button>
          {(file || form.type) && (
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={uploading}
            >
              Limpiar
            </Button>
          )}
        </div>
      </form>

      {/* Listado agrupado */}
      {documents.length === 0 ? (
        <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          No hay documentos cargados todavía. Subí el primero arriba.
        </p>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ category, label, items }) => (
            <div key={category}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {label}{" "}
                <span className="ml-1 text-muted-foreground/60">({items.length})</span>
              </h3>
              {items.length === 0 ? (
                <p className="rounded-md border border-dashed px-4 py-3 text-xs text-muted-foreground">
                  Sin documentos en esta categoría.
                </p>
              ) : (
                <ul className="divide-y rounded-md border">
                  {items.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-start gap-3 p-3 sm:items-center"
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground sm:mt-0">
                        {isPdf(doc.mimeType) ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <ImageIcon className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="font-medium">{doc.type}</span>
                          <span className="text-xs text-muted-foreground">
                            · {formatBytes(doc.sizeBytes)}
                          </span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {doc.fileName}
                        </p>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span>Subido {formatDate(doc.uploadedAt)}</span>
                          {doc.issuedAt && <span>Emisión {formatDate(doc.issuedAt)}</span>}
                          {doc.expiresAt && (
                            <span>Vence {formatDate(doc.expiresAt)}</span>
                          )}
                        </div>
                        {doc.notes && (
                          <p className="mt-1 text-xs text-muted-foreground italic">
                            {doc.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpen(doc.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                          aria-label="Abrir documento"
                          title="Abrir"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Eliminar documento"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
