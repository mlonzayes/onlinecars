import { Star } from "lucide-react";

interface ReviewCardProps {
  review: {
    name: string;
    content: string;
    rating: number;
  };
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < review.rating ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-200"
            }`}
          />
        ))}
      </div>
      <p className="flex-1 text-sm leading-relaxed text-gray-600 italic">
        "{review.content}"
      </p>
      <div className="mt-2 flex items-center gap-3 border-t border-gray-50 pt-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
          {review.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{review.name}</p>
          <p className="text-xs text-gray-400">Cliente Verificado</p>
        </div>
      </div>
    </div>
  );
}
