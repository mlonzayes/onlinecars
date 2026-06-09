# Propuesta Técnica: Isolation y Slugs

## 1. Resumen Ejecutivo
El objetivo de esta fase es aislar completamente los identificadores internos (`id` y `dealershipId`) del modelo `Vehicle` en los endpoints y rutas públicas. Para lograrlo, implementaremos un identificador público amigable (`publicSlug`) que se utilizará en las URLs del catálogo (`/tenant/[slug]/vehiculo/[publicSlug]`) y en las operaciones de las APIs públicas (como generación de leads o listado de vehículos).

## 2. Arquitectura de Datos (Prisma)
Se realizarán las siguientes modificaciones al esquema de base de datos (`schema.prisma`):
- **Modelo `Vehicle`**:
  - Agregar campo: `publicSlug String` (será único por concesionario).
  - Agregar índice: `@@unique([dealershipId, publicSlug])`.
- **Generación del Slug**:
  - Se creará un helper (ej. en `src/lib/utils/slug.ts`) para generar el slug basado en `make`, `model`, `year` y un ID corto de 8 caracteres al final (ej. `nanoid(8)` o un generador similar). Es crucial **NO incluir la patente** en el slug por motivos de privacidad y seguridad.

## 3. Consideraciones de Migración (Backfill)
Dado que existen vehículos en la base de datos sin `publicSlug`:
- **Migración 1**: Modificar `schema.prisma` agregando `publicSlug String @default("")` (o crear la columna y luego rellenar).
- **Script de Backfill**: Se escribirá un script (ej. en un archivo de migración o script suelto) que itere sobre los vehículos existentes, genere un `publicSlug` único y los actualice.
- **Migración 2**: Una vez rellenados los datos, actualizar el esquema para eliminar el default y aplicar la restricción de unicidad (`@@unique([dealershipId, publicSlug])`).

## 4. Cambios en API Públicas
Los endpoints ubicados bajo `/api/public/tenant/[slug]/` deben dejar de exponer identificadores internos.

- **GET `/api/public/tenant/[slug]/vehicles/route.ts`**:
  - Mapear explícitamente la respuesta de los vehículos.
  - Omitir `dealershipId` y el `id` interno.
  - Exponer `publicSlug` (y, si por compatibilidad temporal se requiere un "id" en el cliente, mapear el slug a esa propiedad, aunque es preferible actualizar el cliente).
- **POST `/api/public/tenant/[slug]/leads/route.ts`**:
  - Actualizar `leadSchema` para requerir `vehicleSlug` en lugar de `vehicleId`.
  - En el controlador: usar el `slug` del tenant para obtener el `dealership.id`, luego buscar el `Vehicle` mediante `dealershipId` y `vehicleSlug`.
  - Utilizar el `vehicle.id` interno encontrado para la creación del registro en la tabla `Lead`.

## 5. Rutas Next.js y Componentes
- **Ruta de Detalle de Vehículo**:
  - Renombrar carpeta: `src/app/tenant/[slug]/vehiculo/[id]` a `src/app/tenant/[slug]/vehiculo/[publicSlug]`.
  - Actualizar `page.tsx` para leer `params.publicSlug`.
  - Crear o actualizar función de DB: `getPublishedVehicleBySlug(dealershipId, publicSlug)`.
- **Componente `TenantContactForm`**:
  - Modificar las props para que reciba `vehicleSlug` en lugar de `vehicleId`.
  - Asegurar que envíe `vehicleSlug` en el payload hacia el endpoint de leads.
- **Funciones de Tenant (`src/lib/tenant.ts`)**:
  - Actualizar el tipo `TenantHomeBundleVehicle` para reflejar el uso de `publicSlug` y garantizar que no haya rastros de `dealershipId` o el `id` de base de datos en la carga útil enviada al frontend.

## 6. Riesgos y Consideraciones
- **Colisión de Slugs**: El generador de slugs garantiza unicidad agregando el ID de 8 caracteres al final de cada uno.
- **Caída de URLs Existentes**: Los enlaces con el formato anterior `.../vehiculo/<id>` darán 404. Esto es aceptable y la decisión final ya que la aplicación aún no fue lanzada y no existen links compartidos, evitando la necesidad de redirecciones complejas.
- **Tiempo de Inactividad durante Backfill**: El script de backfill debe ejecutarse cuidadosamente. Se debe asegurar que la aplicación soporte vehículos sin slug durante el proceso, o ejecutar la migración durante una ventana de mantenimiento.
