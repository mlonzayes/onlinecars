-- Add storage `key` column to vehicle_images and sale_documents.
-- Backfill existing rows so we can switch to NOT NULL safely.

-- vehicle_images: agregamos key nullable, hacemos backfill desde la URL
-- (las URLs locales son "/uploads/{key}"), y después seteamos NOT NULL.
ALTER TABLE "vehicle_images" ADD COLUMN "key" TEXT;

UPDATE "vehicle_images"
SET "key" = SUBSTRING("url" FROM '^/uploads/(.*)$')
WHERE "url" LIKE '/uploads/%' AND "key" IS NULL;

-- Fallback para URLs que no matchean el patrón local (caso edge — no debería pasar
-- en este punto del proyecto pero evita que la migración falle).
UPDATE "vehicle_images" SET "key" = "url" WHERE "key" IS NULL;

ALTER TABLE "vehicle_images" ALTER COLUMN "key" SET NOT NULL;

-- sale_documents: igual approach por seguridad. La tabla es nueva y normalmente
-- está vacía en este punto, pero el backfill defensivo no cuesta.
ALTER TABLE "sale_documents" ADD COLUMN "key" TEXT;
ALTER TABLE "sale_documents" ADD COLUMN "notes" TEXT;

UPDATE "sale_documents" SET "key" = "url" WHERE "key" IS NULL;

ALTER TABLE "sale_documents" ALTER COLUMN "key" SET NOT NULL;
