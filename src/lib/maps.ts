// Helpers de mapas. Centralizan la construcción de URLs para no duplicar la
// lógica del embed entre el sitio del tenant (LocationMap) y la preview del
// dashboard (LocationPicker). Todo keyless: OSM para el render, Google solo
// para el deep-link de "cómo llegar" (que es lo que la gente usa para navegar).

// URL del embed oficial de OpenStreetMap (iframe, sin API key). delta define el
// tamaño del bounding box alrededor del punto → más chico = más zoom.
export function osmEmbedUrl(latitude: number, longitude: number, delta = 0.004): string {
  const bbox = [longitude - delta, latitude - delta, longitude + delta, latitude + delta].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
}

// Deep-link a Google Maps con el destino para indicaciones de manejo.
export function googleDirectionsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}
