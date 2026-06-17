-- Saca el flag global `mapEnabled` del dealership. La visibilidad del mapa pasa
-- a controlarse desde el toggle `showMap` del config de la sección Contacto
-- (DealershipSection.config) — evitamos dos toggles para lo mismo. Las coords
-- (latitude/longitude/mapLabel) se quedan: son el DATO de la ubicación.
ALTER TABLE "dealerships"
  DROP COLUMN "mapEnabled";
