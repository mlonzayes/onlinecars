-- Agregar la sección "brands" a todos los dealerships existentes.
-- La selección de marcas oficiales sigue viviendo en theme.selectedBrandIds
-- (no se mueve a la config de la sección) — esta migración solo crea la fila.
--
-- Igual que add_categories_section: la insertamos al final del orden actual
-- para no pisar reordenamientos manuales. Empieza ENABLED (decisión del user:
-- preservar la experiencia actual donde las marcas se ven en el sitio).
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
  'brands',
  true,
  COALESCE((
    SELECT MAX(s2."order") + 1
    FROM "dealership_sections" s2
    WHERE s2."dealershipId" = d."id"
  ), 1),
  'Marcas premium',
  'Acceso directo a las marcas más buscadas del mercado.',
  NULL,
  '{}'::jsonb,
  NOW(),
  NOW()
FROM "dealerships" d
WHERE NOT EXISTS (
  SELECT 1
  FROM "dealership_sections" s
  WHERE s."dealershipId" = d."id" AND s."type" = 'brands'
);
