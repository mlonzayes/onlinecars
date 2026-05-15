import type { IconType } from "react-icons";

export interface RoadmapItemProps {
  icon: IconType;
  title: string;
  description: string;
  /** Marca el item como pendiente (en el roadmap, no disponible aún) */
  comingSoon?: boolean;
  /** Destaca el item (ej: integración principal) */
  highlighted?: boolean;
  /** Etiqueta de fecha estimada (ej: "Q1 2026", "On demand"). Solo aplica si comingSoon */
  eta?: string;
}

export function RoadmapItem({
  icon: Icon,
  title,
  description,
  comingSoon,
  highlighted,
  eta,
}: RoadmapItemProps) {
  return (
    <div className="relative flex items-start gap-4 sm:gap-5">
      {/* Bullet sobre la línea del timeline. Disponibles tienen pulse animado. */}
      <div
        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
          comingSoon
            ? "border-2 border-dashed border-gray-300 bg-white text-gray-400"
            : "bg-blue-600 text-white ring-4 ring-blue-100"
        } ${highlighted && !comingSoon ? "shadow-lg shadow-blue-600/30" : ""}`}
      >
        {/* Pulse halo solo en disponibles — animación CSS pura, infinita */}
        {!comingSoon && (
          <span
            aria-hidden
            className="absolute inset-0 -m-1 animate-ping rounded-full bg-blue-500/30"
            style={{ animationDuration: "2.5s" }}
          />
        )}
        <Icon className="relative h-4 w-4" />
      </div>

      {/* Card */}
      <div
        className={`flex-1 rounded-xl border p-4 transition-all ${
          comingSoon
            ? "border-gray-200 bg-white/60"
            : highlighted
              ? "border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-sm"
              : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h3
            className={`text-sm font-bold sm:text-base ${
              comingSoon ? "text-gray-700" : "text-gray-900"
            }`}
          >
            {title}
          </h3>
          {eta && (
            <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
              {eta}
            </span>
          )}
        </div>
        <p
          className={`mt-1.5 text-xs leading-relaxed sm:text-sm ${
            comingSoon ? "text-gray-500" : "text-gray-600"
          }`}
        >
          {description}
        </p>
      </div>
    </div>
  );
}
