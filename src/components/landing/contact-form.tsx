"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { HONEYPOT_FIELD, HONEYPOT_STYLE } from "@/lib/honeypot";

// Estos string-literals coinciden 1:1 con los del Zod schema del endpoint
// (src/app/api/public/contact/route.ts). Si cambiás uno, cambialo en el otro.
const INTENTS = [
  { value: "plan", label: "Quiero contratar un plan" },
  { value: "demo", label: "Quiero probar gratis (demo)" },
  { value: "otro", label: "Otra consulta" },
] as const;

const PLANS = [
  { value: "base", label: "Base" },
  { value: "media", label: "Media" },
  { value: "premium", label: "Premium" },
  { value: "enterprise", label: "Enterprise" },
  { value: "no_se", label: "No sé todavía" },
] as const;

type Intent = (typeof INTENTS)[number]["value"];

export function LandingContactForm() {
  const [form, setForm] = useState({
    intent: "plan" as Intent,
    plan: "no_se" as string,
    name: "",
    email: "",
    phone: "",
    dealership: "",
    message: "",
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
    if (!form.email.trim()) {
      toast.error("Ingresá tu email");
      return;
    }

    setLoading(true);

    try {
      // Si no eligió plan (intent != "plan"), no mandamos el campo plan
      // para mantener el payload chico y semánticamente claro.
      const payload: Record<string, string> = {
        intent: form.intent,
        name: form.name,
        email: form.email,
        phone: form.phone,
        dealership: form.dealership,
        message: form.message,
        [HONEYPOT_FIELD]: form[HONEYPOT_FIELD],
      };
      if (form.intent === "plan") payload.plan = form.plan;

      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Send className="h-5 w-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-blue-800">¡Consulta enviada!</h3>
        <p className="mt-1 text-sm text-blue-600">
          Nos pondremos en contacto a la brevedad.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";
  const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot — escondido visualmente para humanos, los bots lo llenan. */}
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

      {/* Intent */}
      <div>
        <label htmlFor="contact-intent" className={labelClass}>
          ¿Cómo te podemos ayudar? <span className="text-red-500">*</span>
        </label>
        <select
          id="contact-intent"
          value={form.intent}
          onChange={(e) => handleChange("intent", e.target.value)}
          className={inputClass}
        >
          {INTENTS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Plan — solo si quiere contratar */}
      {form.intent === "plan" && (
        <div>
          <label htmlFor="contact-plan" className={labelClass}>
            ¿Qué plan te interesa?
          </label>
          <select
            id="contact-plan"
            value={form.plan}
            onChange={(e) => handleChange("plan", e.target.value)}
            className={inputClass}
          >
            {PLANS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

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
          <label htmlFor="contact-dealership" className={labelClass}>
            Concesionario
          </label>
          <input
            id="contact-dealership"
            type="text"
            value={form.dealership}
            onChange={(e) => handleChange("dealership", e.target.value)}
            className={inputClass}
            placeholder="Nombre de tu concesionario"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
