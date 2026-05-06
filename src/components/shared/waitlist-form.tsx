"use client";

import { useState } from "react";
import { waitlistSchema } from "@/lib/validators/waitlist";
import { HONEYPOT_FIELD, HONEYPOT_STYLE } from "@/lib/honeypot";

type FormState = "idle" | "loading" | "success" | "error" | "duplicate";

export function WaitlistForm() {
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");

    const form = e.currentTarget;
    const formData = new FormData(form);

    const data = {
      email: formData.get("email") as string,
      name: formData.get("name") as string,
      dealership: formData.get("dealership") as string,
      phone: formData.get("phone") as string,
      // Honeypot — campo invisible para humanos. Si llega con valor, el server
      // lo descarta silenciosamente.
      [HONEYPOT_FIELD]: (formData.get(HONEYPOT_FIELD) as string) ?? "",
    };

    const parsed = waitlistSchema.safeParse(data);
    if (!parsed.success) {
      setState("error");
      setErrorMsg("Revisá los datos ingresados.");
      return;
    }

    try {
      // Mandamos `data` raw (no parsed) para que el campo honeypot llegue al server.
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.status === 409) {
        setState("duplicate");
        return;
      }

      if (!res.ok) {
        setState("error");
        setErrorMsg("Ocurrió un error. Intentá de nuevo.");
        return;
      }

      setState("success");
      form.reset();
    } catch {
      setState("error");
      setErrorMsg("Sin conexión. Intentá de nuevo.");
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-2xl bg-green-50 border border-green-200 p-8 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-xl font-bold text-green-800 mb-2">
          ¡Ya estás en la lista!
        </h3>
        <p className="text-green-700">
          Te avisamos cuando esté listo. Mientras tanto, guardá este sitio.
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
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={HONEYPOT_STYLE}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tu nombre
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Juan García"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Teléfono
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+54 11 1234-5678"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="dealership"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Nombre de tu concesionario
        </label>
        <input
          id="dealership"
          name="dealership"
          type="text"
          placeholder="Ej: Automotores del Sur"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="vos@concesionario.com"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {state === "duplicate" && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          Este email ya está registrado. ¡Ya estás en la lista!
        </p>
      )}
      {state === "error" && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "loading"}
        className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 text-sm transition cursor-pointer disabled:cursor-not-allowed"
      >
        {state === "loading" ? "Enviando..." : "Quiero acceso anticipado →"}
      </button>
      <p className="text-xs text-center text-gray-400">
        Sin spam. Solo te avisamos cuando esté listo.
      </p>
    </form>
  );
}
