-- Agregar la sección "categories" a todos los dealerships existentes que
-- todavía no la tengan. Para nuevos dealerships, la seed function de
-- src/lib/sections/seed.ts ya la incluye automáticamente vía SECTION_TYPES.
--
-- Diseño:
--  - Insertamos al FINAL del orden (max + 1) para no pisar el orden manual
--    que el dealer haya hecho. Si el dealer quiere moverla más arriba, lo hace
--    desde el sections-builder.
--  - El id se genera con gen_random_uuid() — el column es TEXT, acepta cualquier
--    string único. No tiene que ser un cuid real para registros legacy.
--  - WHERE NOT EXISTS es idempotente: si por algún motivo ya existe la sección
--    (manual seed, migración corrida dos veces, etc), no la duplica.

INSERT INTO "dealership_sections" (
  "id",
  "dealershipId",
  "type",
  "enabled",
  "order",
  "title",
  "subtitle",
  "content",
  "config",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  d."id",
  'categories',
  true,
  COALESCE((
    SELECT MAX(s2."order") + 1
    FROM "dealership_sections" s2
    WHERE s2."dealershipId" = d."id"
  ), 1),
  'Categorías',
  'Filtrá rápido por el tipo de vehículo que buscás.',
  NULL,
  '{}'::jsonb,
  NOW(),
  NOW()
FROM "dealerships" d
WHERE NOT EXISTS (
  SELECT 1
  FROM "dealership_sections" s
  WHERE s."dealershipId" = d."id" AND s."type" = 'categories'
);
