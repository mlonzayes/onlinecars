"use client";

import { useState } from "react";
import { Star, Loader2, CheckCircle2 } from "lucide-react";

interface ReviewFormProps {
  slug: string;
  dealershipName: string;
}

export function ReviewForm({ slug, dealershipName }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      content: formData.get("content") as string,
      rating,
    };

    try {
      const res = await fetch(`/api/tenant/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Error al enviar la opinión");

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">¡Gracias por tu opinión!</h3>
        <p className="mt-2 text-gray-500">
          Hemos recibido tu testimonio. Será revisado por el equipo de {dealershipName} antes de publicarse.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-6 text-sm font-semibold text-[var(--tenant-primary)] hover:underline"
        >
          Enviar otra opinión
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
          {error}
        </div>
      )}

      {/* Estrellas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ¿Cómo calificarías tu experiencia?
        </label>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const val = i + 1;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setRating(val)}
                onMouseEnter={() => setHoveredRating(val)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    val <= (hoveredRating || rating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-gray-100 text-gray-200 hover:text-amber-200"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Nombre */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Tu nombre
        </label>
        <input
          type="text"
          name="name"
          id="name"
          required
          placeholder="Ej: Juan Pérez"
          className="mt-2 block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm outline-none transition-all focus:border-[var(--tenant-primary)] focus:ring-2 focus:ring-[var(--tenant-primary)]/20"
        />
      </div>

      {/* Mensaje */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          Contanos tu experiencia
        </label>
        <textarea
          name="content"
          id="content"
          rows={4}
          required
          placeholder="Excelente atención, muy transparentes y el auto estaba impecable..."
          className="mt-2 block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm outline-none transition-all focus:border-[var(--tenant-primary)] focus:ring-2 focus:ring-[var(--tenant-primary)]/20"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-gray-800 hover:-translate-y-0.5 active:scale-95 disabled:pointer-events-none disabled:opacity-70"
        style={{ backgroundColor: "var(--tenant-primary)" }}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Enviando...
          </>
        ) : (
          "Enviar opinión"
        )}
      </button>
    </form>
  );
}
