"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PiPaperPlaneTilt, PiCircleNotch, PiCheckCircle } from "react-icons/pi";
import { HONEYPOT_FIELD, HONEYPOT_STYLE } from "@/lib/honeypot";
import { trackMetaEventWithId } from "@/lib/meta/client";
import { META_EVENT_ID_FIELD } from "@/lib/meta/events";
import { CLARITY_EVENTS, setClarityTag, trackClarityEvent } from "@/lib/clarity/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
      trackClarityEvent(CLARITY_EVENTS.contactValidationError);
      toast.error("Ingresá tu nombre");
      return;
    }
    if (!form.email.trim()) {
      trackClarityEvent(CLARITY_EVENTS.contactValidationError);
      toast.error("Ingresá tu email");
      return;
    }

    setLoading(true);
    try {
      const intent = plan ? "plan" : "otro";
      setClarityTag("contact_intent", intent);
      if (plan) setClarityTag("plan", plan);
      trackClarityEvent(CLARITY_EVENTS.contactSubmitted);

      // Conversión Lead por el pixel del browser. El eventId que devuelve viaja
      // en el payload para que el server mande el MISMO evento por la
      // Conversions API y Meta lo deduplique en vez de contarlo dos veces.
      // Se dispara ANTES del fetch a propósito: si el visitante cierra la
      // pestaña con la request en vuelo, la conversión ya salió igual.
      const metaEventId = trackMetaEventWithId("Lead", {
        contentName: `contacto-${intent}`,
        contentCategory: "saas-motorflow",
        ...(plan ? { plan } : {}),
      });

      const payload: Record<string, string> = {
        intent,
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message,
        [HONEYPOT_FIELD]: form[HONEYPOT_FIELD],
        [META_EVENT_ID_FIELD]: metaEventId,
      };
      if (plan) payload.plan = plan;

      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error al enviar la consulta");

      trackClarityEvent(CLARITY_EVENTS.contactSent);
      setSent(true);
      toast.success("¡Consulta enviada! Te contactamos pronto.");
    } catch {
      trackClarityEvent(CLARITY_EVENTS.contactFailed);
      toast.error("No se pudo enviar la consulta. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl bg-paper p-8 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand/10">
          <PiCheckCircle className="h-6 w-6 text-brand" />
        </div>
        <h3 className="text-base text-ink">Recibimos tu consulta</h3>
        <p className="mt-1 text-sm text-ink-soft">Te escribimos pronto.</p>
      </div>
    );
  }

  const fieldClass = "h-11 border-ink/15 bg-white text-base sm:text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
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

      {/* Labels solo para lectores de pantalla: el placeholder alcanza a la vista. */}
      <Label htmlFor="contact-name" className="sr-only">Nombre</Label>
      <Input
        id="contact-name"
        value={form.name}
        onChange={(e) => handleChange("name", e.target.value)}
        className={fieldClass}
        placeholder="Nombre *"
        autoComplete="name"
        required
      />
      <Label htmlFor="contact-email" className="sr-only">Email</Label>
      <Input
        id="contact-email"
        type="email"
        value={form.email}
        onChange={(e) => handleChange("email", e.target.value)}
        className={fieldClass}
        placeholder="Email *"
        autoComplete="email"
        required
      />
      <Label htmlFor="contact-phone" className="sr-only">WhatsApp</Label>
      <Input
        id="contact-phone"
        type="tel"
        value={form.phone}
        onChange={(e) => handleChange("phone", e.target.value)}
        className={fieldClass}
        placeholder="WhatsApp"
        autoComplete="tel"
      />
      <Label htmlFor="contact-message" className="sr-only">Mensaje</Label>
      <Textarea
        id="contact-message"
        value={form.message}
        onChange={(e) => handleChange("message", e.target.value)}
        rows={3}
        className="resize-none border-ink/15 bg-white text-base sm:text-sm"
        placeholder="Mensaje"
      />

      <Button type="submit" disabled={loading} className="h-11 w-full bg-brand text-white hover:bg-brand-deep">
        {loading ? (
          <>
            <PiCircleNotch className="animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <PiPaperPlaneTilt />
            Enviar
          </>
        )}
      </Button>
    </form>
  );
}
