"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface MapPickerProps {
  // null = todavía no se marcó ubicación (el mapa arranca sin pin).
  latitude: number | null;
  longitude: number | null;
  // Se llama al clickear el mapa o arrastrar el pin, con las coords nuevas.
  onChange: (latitude: number, longitude: number) => void;
}

// Pin SVG inline como divIcon — evita el bug clásico de Leaflet donde los assets
// marker-icon.png se rompen con el bundler. La punta del teardrop apunta abajo.
const PIN_ICON = L.divIcon({
  className: "",
  html: `<svg width="34" height="34" viewBox="0 0 24 24" fill="#dc2626" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,.35))">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.5" fill="#ffffff" stroke="none"/>
  </svg>`,
  iconSize: [34, 34],
  iconAnchor: [17, 32], // punta inferior del pin
});

// Fallback cuando todavía no hay ubicación: vista amplia centrada en Buenos Aires
// (zona más poblada). El dealer navega/zoomea y clickea su punto.
const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816];
const DEFAULT_ZOOM = 5;
const PIN_ZOOM = 16;

// Crea el marcador arrastrable y enchufa el dragend. Helper a nivel módulo para
// reusar entre el init y el click handler.
function attachMarker(
  map: L.Map,
  lat: number,
  lng: number,
  onChange: (la: number, ln: number) => void
): L.Marker {
  const marker = L.marker([lat, lng], { draggable: true, icon: PIN_ICON }).addTo(map);
  marker.on("dragend", () => {
    const p = marker.getLatLng();
    onChange(p.lat, p.lng);
  });
  return marker;
}

// Mapa interactivo para fijar la ubicación: clickeá para poner el pin o arrastralo
// para ajustarlo. Leaflet + tiles de OSM (sin API key). Client-only: Leaflet toca
// window/document → inicializar en useEffect y cargar con next/dynamic({ ssr:false }).
export default function MapPicker({ latitude, longitude, onChange }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  // Ref para no recrear el mapa cuando cambia la prop onChange (closure fresca).
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Init del mapa — una sola vez.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const hasCoords = latitude !== null && longitude !== null;
    const map = L.map(containerRef.current).setView(
      hasCoords ? [latitude, longitude] : DEFAULT_CENTER,
      hasCoords ? PIN_ZOOM : DEFAULT_ZOOM
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    const cb = (la: number, ln: number) => onChangeRef.current(la, ln);

    if (hasCoords) {
      markerRef.current = attachMarker(map, latitude, longitude, cb);
    }

    // Click en el mapa = poner el pin ahí (o moverlo si ya existe).
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng);
      } else {
        markerRef.current = attachMarker(map, e.latlng.lat, e.latlng.lng, cb);
      }
      onChangeRef.current(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;

    // El contenedor puede montarse con tamaño 0 (dentro de la card) — forzamos
    // recálculo en el próximo tick para que los tiles se rendericen completos.
    const t = setTimeout(() => map.invalidateSize(), 0);

    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Init-once: las coords iniciales se leen acá. El único cambio externo que
    // importa (limpiar la ubicación) lo maneja el efecto de abajo. Click y drag
    // mantienen el pin en sync sin recentrar (no peleamos con el usuario).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si desde afuera se limpia la ubicación (botón "quitar"), sacamos el pin.
  useEffect(() => {
    if (!mapRef.current) return;
    if (latitude === null || longitude === null) {
      markerRef.current?.remove();
      markerRef.current = null;
    }
  }, [latitude, longitude]);

  return <div ref={containerRef} className="h-72 w-full" />;
}
