"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PiPaperPlaneTilt, PiCircleNotch, PiCheckCircle } from "react-icons/pi";
import { HONEYPOT_FIELD, HONEYPOT_STYLE } from "@/lib/honeypot";

// Planes válidos — coinciden con el Zod del endpoint (/api/public/contact).
const PLAN_KEYS = ["base", "media", "premium", "enterprise", "no_se"] as const;

export function LandingContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    [HONEYPOT_FIELD]: "",
  });
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // Si el visitante llegó desde una card de precios, leemos el plan de la cookie
  // para mandar intent="plan" sin agregar un select más al form.
  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )selected_plan_id=([^;]+)/);
    const val = match?.[1];
    if (val && (PLAN_KEYS as readonly string[]).includes(val)) setPlan(val);
  }, []);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Ingresá tu nombre");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Ingresá tu email");
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, string> = {
        intent: plan ? "plan" : "otro",
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message,
        [HONEYPOT_FIELD]: form[HONEYPOT_FIELD],
      };
      if (plan) payload.plan = plan;

      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error al enviar la consulta");

      setSent(true);
      toast.success("¡Consulta enviada! Te contactamos pronto.");
    } catch {
      toast.error("No se pudo enviar la consulta. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-8 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-blue-100">
          <PiCheckCircle className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">¡Consulta enviada!</h3>
        <p className="mt-1 text-sm font-light text-gray-500">
          Nos ponemos en contacto a la brevedad.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30";
  const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot — invisible para humanos, los bots lo llenan. */}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={inputClass}
            placeholder="Tu nombre"
            required
          />
        </div>
        <div>
          <label htmlFor="contact-email" className={labelClass}>
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className={inputClass}
            placeholder="tu@email.com"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-phone" className={labelClass}>
          Teléfono / WhatsApp
        </label>
        <input
          id="contact-phone"
          type="tel"
          value={form.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          className={inputClass}
          placeholder="+54 9 11 ..."
        />
      </div>

      <div>
        <label htmlFor="contact-message" className={labelClass}>
          Mensaje
        </label>
        <textarea
          id="contact-message"
          value={form.message}
          onChange={(e) => handleChange("message", e.target.value)}
          rows={4}
          className={`${inputClass} resize-none`}
          placeholder="Contanos qué necesitás..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <PiCircleNotch className="h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <PiPaperPlaneTilt className="h-4 w-4" />
            Enviar consulta
          </>
        )}
      </button>
    </form>
  );
}
