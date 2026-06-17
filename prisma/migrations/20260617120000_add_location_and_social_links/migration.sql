-- Ubicación geo + redes sociales del concesionario para el sitio público.
--
-- mapEnabled: controla si el mapa se muestra en el sitio. Default false — el
--   dealer lo activa conscientemente desde el dashboard (ningún sitio aparece
--   con mapa "espontáneamente" al deploy de esta migración).
-- latitude/longitude: coords resueltas por geocoding (OSM/Photon) desde el
--   buscador del dashboard. El dealer no las carga a mano.
-- mapLabel: dirección formateada elegida en el buscador (caption del mapa).
-- socialLinks: JSON con links a redes (instagram, facebook, tiktok, x, threads).
--   WhatsApp NO va acá — reusa la columna `whatsapp`.
ALTER TABLE "dealerships"
  ADD COLUMN "mapEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION,
  ADD COLUMN "mapLabel" TEXT,
  ADD COLUMN "socialLinks" JSONB;
