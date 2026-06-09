"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { HONEYPOT_FIELD, HONEYPOT_STYLE } from "@/lib/honeypot";

interface TenantContactFormProps {
  slug: string;
  vehicleId?: string;
  vehicleTitle?: string;
}

export function TenantContactForm({ slug, vehicleId, vehicleTitle }: TenantContactFormProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: vehicleTitle ? `Hola, me interesa el ${vehicleTitle}. ¿Podrían darme más información?` : "",
    // Honeypot — el server lo descarta silenciosamente si viene con valor.
    [HONEYPOT_FIELD]: "",
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Ingresá tu nombre");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/public/tenant/${slug}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          vehicleId: vehicleId || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Error al enviar la consulta");
      }

      setSent(true);
      toast.success("¡Consulta enviada! Te contactaremos pronto.");
    } catch {
      toast.error("No se pudo enviar la consulta. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Send className="h-5 w-5 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-green-800">
          ¡Consulta enviada!
        </h3>
        <p className="mt-1 text-sm text-green-600">
          Te contactaremos a la brevedad.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot — humano no lo ve, bot lo rellena. */}
      <input
        type="text"
        name={HONEYPOT_FIELD}
        value={form[HONEYPOT_FIELD]}
        onChange={(e) => handleChange(HONEYPOT_FIELD, e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={HONEYPOT_STYLE}
      />
      <div>
        <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-[var(--tenant-fg)]">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          id="contact-name"
          type="text"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className="w-full rounded-xl border border-[var(--tenant-border-strong)] bg-[var(--tenant-surface)] px-4 py-2.5 text-sm text-[var(--tenant-fg)] outline-none transition-all placeholder:text-[var(--tenant-fg-subtle)] focus:border-[var(--tenant-primary)] focus:ring-2 focus:ring-[var(--tenant-primary)]/20"
          placeholder="Tu nombre"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-[var(--tenant-fg)]">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="w-full rounded-xl border border-[var(--tenant-border-strong)] bg-[var(--tenant-surface)] px-4 py-2.5 text-sm text-[var(--tenant-fg)] outline-none transition-all placeholder:text-[var(--tenant-fg-subtle)] focus:border-[var(--tenant-primary)] focus:ring-2 focus:ring-[var(--tenant-primary)]/20"
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <label htmlFor="contact-phone" className="mb-1.5 block text-sm font-medium text-[var(--tenant-fg)]">
            Teléfono
          </label>
          <input
            id="contact-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="w-full rounded-xl border border-[var(--tenant-border-strong)] bg-[var(--tenant-surface)] px-4 py-2.5 text-sm text-[var(--tenant-fg)] outline-none transition-all placeholder:text-[var(--tenant-fg-subtle)] focus:border-[var(--tenant-primary)] focus:ring-2 focus:ring-[var(--tenant-primary)]/20"
            placeholder="+54 11 1234-5678"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-[var(--tenant-fg)]">
          Mensaje
        </label>
        <textarea
          id="contact-message"
          value={form.message}
          onChange={(e) => handleChange("message", e.target.value)}
          rows={4}
          className="w-full resize-none rounded-xl border border-[var(--tenant-border-strong)] bg-[var(--tenant-surface)] px-4 py-2.5 text-sm text-[var(--tenant-fg)] outline-none transition-all placeholder:text-[var(--tenant-fg-subtle)] focus:border-[var(--tenant-primary)] focus:ring-2 focus:ring-[var(--tenant-primary)]/20"
          placeholder="Contanos qué estás buscando..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--tenant-primary)] px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Enviar consulta
          </>
        )}
      </button>
    </form>
  );
}
