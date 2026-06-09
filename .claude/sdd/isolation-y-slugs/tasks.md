# Plan de Tareas: Isolation y Slugs

## Fase 1: Capa Base y Esquema de Datos
- [x] **1.1.** Crear la función utilitaria `generateVehicleSlug(make, model, year)` en `src/lib/utils/slug.ts`, garantizando la inclusión del hash `nanoid(8)`.
- [x] **1.2.** Modificar `prisma/schema.prisma`: agregar `publicSlug String @default("")` al modelo `Vehicle`.
- [x] **1.3.** Crear la primera migración para aplicar la columna en la BD.

## Fase 2: Script de Migración (Backfill)
- [x] **2.1.** Crear un script (ej. en `prisma/seed.ts` o un script custom de node) que consulte todos los vehículos existentes donde `publicSlug` sea `""`.
- [x] **2.2.** Iterar y actualizar cada vehículo calculando su `publicSlug`.
- [x] **2.3.** Modificar `prisma/schema.prisma`: remover `@default("")` y agregar el índice `@@unique([dealershipId, publicSlug])`.
- [x] **2.4.** Crear y aplicar la segunda migración para asentar las restricciones en la BD.

## Fase 3: Capa de APIs y Tipos
- [ ] **3.1.** Actualizar los tipos exportados (ej. `TenantHomeBundleVehicle` en `src/lib/tenant.ts`) para incluir `publicSlug` y quitar `id`/`dealershipId`.
- [ ] **3.2.** Actualizar `GET /api/public/tenant/[slug]/vehicles/route.ts` para que el JSON retornado refleje los nuevos tipos de exposición (con slug, sin id).
- [ ] **3.3.** Actualizar el schema Zod de `POST /api/public/tenant/[slug]/leads/route.ts` cambiando `vehicleId` a `vehicleSlug`. Modificar el controlador para buscar el vehículo por slug en la base de datos antes de crear el lead.

## Fase 4: Frontend y Enrutamiento
- [ ] **4.1.** Renombrar el directorio de detalle: de `src/app/tenant/[slug]/vehiculo/[id]` a `src/app/tenant/[slug]/vehiculo/[publicSlug]`.
- [ ] **4.2.** Actualizar el fetching de datos en el `page.tsx` del detalle de vehículo para resolver con `dealershipId` y `publicSlug`.
- [ ] **4.3.** Actualizar el componente `TenantContactForm` para manejar la prop `vehicleSlug` en lugar de `vehicleId`.
- [ ] **4.4.** Revisar componentes de catálogo/listas (ej. tarjetas de vehículos) y actualizar todos los `<Link>` para enrutar a `/tenant/[slug]/vehiculo/[publicSlug]`.

## Fase 5: Verificación y QA
- [ ] **5.1.** Crear un vehículo nuevo en el Dashboard y confirmar que se genere correctamente el `publicSlug`.
- [ ] **5.2.** Acceder al frontend público (tenant slug local) y confirmar que el catálogo carga y la URL de detalle usa el slug correcto.
- [ ] **5.3.** Probar el formulario de contacto (Lead) de un vehículo y confirmar que el backend lo registra correctamente sin usar IDs.
- [ ] **5.4.** Navegar a un enlace antiguo con `id` explícito y confirmar que la aplicación devuelve de forma correcta un 404 (Not Found).
