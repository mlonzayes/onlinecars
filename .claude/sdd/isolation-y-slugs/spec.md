# Especificación Técnica: Isolation y Slugs

## 1. Introducción
Esta especificación detalla la implementación para aislar los identificadores internos de base de datos (`id` y `dealershipId`) del modelo `Vehicle`, exponiendo en su lugar un `publicSlug` seguro y amigable.

## 2. Cambios en el Esquema (Prisma)
**Archivo:** `prisma/schema.prisma`
- Modificar el modelo `Vehicle`:
  - Agregar `publicSlug String` (temporalmente con `@default("")` para facilitar migración, o resolverlo en el script).
  - Agregar la restricción de unicidad: `@@unique([dealershipId, publicSlug])`.

## 3. Lógica de Negocio: Generación de Slug
**Archivo sugerido:** `src/lib/utils/slug.ts` o equivalente.
- **Función:** `generateVehicleSlug({ make, model, year }: { make: string, model: string, year: number })`
- **Formato:** `[marca]-[modelo]-[año]-[id-corto-de-8-caracteres]`
- **Requisitos:**
  - El string de marca y modelo debe ser transformado (minúsculas, reemplazar espacios por guiones, quitar caracteres especiales).
  - El ID corto final de 8 caracteres se genera utilizando una librería como `nanoid(8)` o un utilitario similar en Node.
  - **Estrictamente prohibido:** Utilizar la patente del vehículo o su `id` primario en el slug.

## 4. Migración de Datos (Backfill)
- Se creará un script de migración que procese todos los vehículos existentes.
- Para cada uno, llamará a `generateVehicleSlug` y actualizará el registro.
- Al terminar, se asegurará la unicidad `@@unique([dealershipId, publicSlug])` a nivel de base de datos.

## 5. Contratos de API (Endpoints Públicos)
- **GET `/api/public/tenant/[slug]/vehicles/route.ts`**:
  - En la proyección (select) de Prisma, incluir `publicSlug` y explícitamente **no enviar** `id` ni `dealershipId`.
- **POST `/api/public/tenant/[slug]/leads/route.ts`**:
  - Modificar el esquema Zod de validación: reemplazar `vehicleId` por `vehicleSlug`.
  - Resolución: Obtener `dealershipId` vía el tenant slug. Buscar en Prisma `Vehicle` con `publicSlug` y `dealershipId`. Usar el `id` interno hallado para vincular el `Lead`.

## 6. Rutas de Next.js y Componentes
- **Ruta de Vehículo:**
  - Renombrar el directorio `src/app/tenant/[slug]/vehiculo/[id]` a `src/app/tenant/[slug]/vehiculo/[publicSlug]`.
  - Actualizar `page.tsx` y `layout.tsx` (si aplica) para consumir `params.publicSlug` en lugar de `params.id`.
- **Formularios / UI:**
  - Componentes como `TenantContactForm` o tarjetas de listado de vehículos deben recibir y usar `publicSlug` (ej. en enlaces `<Link href="...">` y en payloads POST).

## 7. Comportamiento ante URLs Antiguas
Dado que la aplicación aún no ha sido compartida públicamente, **no se implementarán redirecciones 301**. Cualquier intento de acceder con un `id` numérico o formato antiguo devolverá un 404 (Not Found).
