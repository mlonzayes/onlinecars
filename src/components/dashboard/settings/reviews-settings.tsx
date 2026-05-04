"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, CheckCircle, XCircle, Trash2, MessageSquareQuote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Tipo serializado: las dates vienen como string ISO desde el server.
// La serialización se hace inline en el server page (no acá, porque este
// archivo es "use client" y Next 15 no permite llamar funciones de client desde server).
export interface ReviewData {
  id: string;
  name: string;
  content: string;
  rating: number;
  status: string;
  createdAt: string;
}

interface ReviewsSettingsProps {
  initialReviews: ReviewData[];
}

export function ReviewsSettings({ initialReviews }: ReviewsSettingsProps) {
  const [reviews, setReviews] = useState<ReviewData[]>(initialReviews);
  const router = useRouter();

  async function handleStatusChange(id: string, newStatus: string) {
    const previous = reviews;
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );

    try {
      const res = await fetch(`/api/dashboard/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Error updating status");
      router.refresh();
    } catch {
      setReviews(previous);
      toast.error("No se pudo actualizar la opinión.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta opinión permanentemente?")) return;

    const previous = reviews;
    setReviews((prev) => prev.filter((r) => r.id !== id));

    try {
      const res = await fetch(`/api/dashboard/reviews/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error deleting review");
      router.refresh();
    } catch {
      setReviews(previous);
      toast.error("No se pudo eliminar la opinión.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareQuote className="h-4 w-4 text-purple-500" />
          Opiniones de clientes
        </CardTitle>
        <CardDescription>
          Moderá las reseñas antes de que aparezcan en la web pública.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <Star className="size-8 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-semibold">No hay opiniones todavía</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Tus clientes aún no dejaron testimonios. Compartiles el link público
              para que empiecen a opinar.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((review) => (
              <div
                key={review.id}
                className={`relative flex flex-col gap-3 rounded-xl border p-4 shadow-sm transition-all ${
                  review.status === "pending"
                    ? "border-yellow-200 bg-yellow-50/50"
                    : review.status === "approved"
                    ? "border-green-200 bg-white"
                    : "border-red-200 bg-red-50/50 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-gray-200 text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  {review.status === "pending" && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                      Pendiente
                    </span>
                  )}
                  {review.status === "approved" && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      Aprobada
                    </span>
                  )}
                  {review.status === "rejected" && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                      Oculta
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {review.name}
                  </p>
                  <p className="mt-1 line-clamp-4 text-sm text-muted-foreground">
                    &ldquo;{review.content}&rdquo;
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
                  <div className="flex items-center gap-2">
                    {review.status !== "approved" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(review.id, "approved")}
                        className="h-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Aprobar
                      </Button>
                    )}
                    {review.status !== "rejected" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(review.id, "rejected")}
                        className="h-8 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Ocultar
                      </Button>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(review.id)}
                    className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

