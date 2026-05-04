"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Construction, Loader2 } from "lucide-react";
import { FUEL_TYPES, TRANSMISSION_TYPES } from "@/lib/constants";

interface QuoteFormProps {
  whatsappUrl: string | null;
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  brand: string;
  model: string;
  year: string;
  kilometers: string;
  fuelType: string;
  transmission: string;
  notes: string;
}

const INITIAL_STATE: FormState = {
  name: "",
  phone: "",
  email: "",
  brand: "",
  model: "",
  year: "",
  kilometers: "",
  fuelType: "",
  transmission: "",
  notes: "",
};

// Form de cotización: por ahora SIN backend.
// Al hacer submit muestra un toast informativo y, si el dealer tiene WhatsApp,
// invita a contactar por ahí. Cuando se implemente el endpoint, reemplazar handleSubmit.
export function QuoteForm({ whatsappUrl }: QuoteFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);

  function handleField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Simulamos un pequeño delay para que se sienta natural.
    await new Promise((r) => setTimeout(r, 600));
    toast.info(
      "Cotización online en desarrollo. Por ahora contactanos por WhatsApp para procesar tu cotización.",
      { duration: 6000 }
    );
    setSubmitting(false);
  }

  return (
    <div className="space-y-6">
      {/* Aviso de WIP */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <Construction className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Funcionalidad en desarrollo</p>
          <p className="mt-1 text-amber-800">
            Estamos preparando el sistema de cotización online. Por ahora, si querés
            cotizar tu auto,{" "}
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline underline-offset-2 hover:text-amber-700"
              >
                contactanos por WhatsApp
              </a>
            ) : (
              "escribinos por nuestros canales de contacto"
            )}
            .
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
      >
        {/* Datos del vendedor */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
            Tus datos
          </h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field
              label="Nombre y apellido"
              required
              value={form.name}
              onChange={(v) => handleField("name", v)}
              placeholder="Juan Pérez"
            />
            <Field
              label="Teléfono / WhatsApp"
              required
              value={form.phone}
              onChange={(v) => handleField("phone", v)}
              placeholder="11 1234-5678"
              type="tel"
            />
            <div className="sm:col-span-2">
              <Field
                label="Email"
                value={form.email}
                onChange={(v) => handleField("email", v)}
                placeholder="tu@email.com"
                type="email"
              />
            </div>
          </div>
        </div>

        {/* Datos del vehículo */}
        <div className="border-t border-slate-200 pt-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
            Datos del vehículo
          </h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field
              label="Marca"
              required
              value={form.brand}
              onChange={(v) => handleField("brand", v)}
              placeholder="Toyota"
            />
            <Field
              label="Modelo"
              required
              value={form.model}
              onChange={(v) => handleField("model", v)}
              placeholder="Corolla"
            />
            <Field
              label="Año"
              required
              value={form.year}
              onChange={(v) => handleField("year", v)}
              placeholder="2020"
              type="number"
            />
            <Field
              label="Kilómetros"
              value={form.kilometers}
              onChange={(v) => handleField("kilometers", v)}
              placeholder="50000"
              type="number"
            />
            <SelectField
              label="Combustible"
              value={form.fuelType}
              onChange={(v) => handleField("fuelType", v)}
              options={FUEL_TYPES.map((f) => ({
                value: f,
                label: f.charAt(0).toUpperCase() + f.slice(1),
              }))}
            />
            <SelectField
              label="Transmisión"
              value={form.transmission}
              onChange={(v) => handleField("transmission", v)}
              options={TRANSMISSION_TYPES.map((t) => ({
                value: t,
                label: t === "manual" ? "Manual" : "Automática",
              }))}
            />
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Comentarios adicionales
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => handleField("notes", e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Estado general, equipamiento, detalles relevantes..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[var(--tenant-primary)] focus:ring-2 focus:ring-[var(--tenant-primary)]/20"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--tenant-primary)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar cotización"
          )}
        </button>
      </form>
    </div>
  );
}

// --- Subcomponentes auxiliares ---

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}

function Field({ label, value, onChange, placeholder, type = "text", required }: FieldProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">
        {label}
        {required && " *"}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[var(--tenant-primary)] focus:ring-2 focus:ring-[var(--tenant-primary)]/20"
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[var(--tenant-primary)] focus:ring-2 focus:ring-[var(--tenant-primary)]/20"
      >
        <option value="">Seleccionar</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
