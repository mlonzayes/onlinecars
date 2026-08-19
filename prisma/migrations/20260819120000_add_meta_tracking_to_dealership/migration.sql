-- Meta (Facebook) tracking por tenant: Pixel del browser + Conversions API.
--
-- Todas las columnas son nullable o tienen default, así que la migración es
-- segura sobre datos existentes: ningún dealership queda con tracking activo
-- por accidente (metaTrackingEnabled arranca en false).
--
-- metaCapiToken guarda un SECRETO del dealer. No se indexa ni se loggea, y el
-- GET de /api/concesionario lo enmascara antes de responder.
ALTER TABLE "dealerships" ADD COLUMN "metaPixelId" TEXT;
ALTER TABLE "dealerships" ADD COLUMN "metaCapiToken" TEXT;
ALTER TABLE "dealerships" ADD COLUMN "metaTestEventCode" TEXT;
ALTER TABLE "dealerships" ADD COLUMN "metaTrackingEnabled" BOOLEAN NOT NULL DEFAULT false;
