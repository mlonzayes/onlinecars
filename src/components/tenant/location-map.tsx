import { MapPin, Navigation } from "lucide-react";
import { googleMapEmbedUrl, googleDirectionsUrl } from "@/lib/maps";

interface LocationMapProps {
  latitude: number;
  longitude: number;
  // Dirección formateada elegida en el dashboard (caption del mapa).
  label: string | null;
  className?: string;
}

// Mapa de la ubicación del concesionario. Usa el embed keyless de Google Maps
// (iframe, sin API key) — las coords vienen ya resueltas desde el dashboard.
// El link "Cómo llegar" abre Google Maps con indicaciones de manejo.
export function LocationMap({ latitude, longitude, label, className }: LocationMapProps) {
  const embedUrl = googleMapEmbedUrl(latitude, longitude);
  const directionsUrl = googleDirectionsUrl(latitude, longitude);

  return (
    <div className={`overflow-hidden rounded-xl border border-[var(--tenant-border)] ${className ?? ""}`}>
      <iframe
        title="Ubicación del concesionario"
        src={embedUrl}
        loading="lazy"
        className="h-64 w-full border-0 sm:h-full sm:min-h-[20rem]"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex items-center justify-between gap-3 border-t border-[var(--tenant-border)] bg-[var(--tenant-surface)] px-4 py-3">
        {label && (
          <p className="flex items-center gap-2 text-sm text-[var(--tenant-fg-muted)]">
            <MapPin className="h-4 w-4 shrink-0 text-[var(--tenant-primary)]" />
            <span className="line-clamp-1">{label}</span>
          </p>
        )}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex shrink-0 items-center gap-1.5 text-sm font-medium text-[var(--tenant-primary)] hover:underline"
        >
          <Navigation className="h-4 w-4" />
          Cómo llegar
        </a>
      </div>
    </div>
  );
}
