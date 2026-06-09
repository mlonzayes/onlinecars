# Exploration: Isolation y Slugs

## 1. Impacto en el esquema de Prisma
- **Modelo `Vehicle`**: Es necesario agregar un nuevo campo `publicSlug String`. 
  - Para asegurar la unicidad por concesionario, se debe agregar el índice: `@@unique([dealershipId, publicSlug])`.
  - Será necesario generar este `publicSlug` al momento de crear o actualizar el vehículo (ej. derivándolo de la marca, modelo y un sufijo aleatorio o identificador corto).
  - Habrá que planificar una migración de datos para popular los `publicSlug` de los vehículos existentes.

## 2. Endpoints Públicos de Tenant
- **`/api/public/tenant/[slug]/vehicles/route.ts`**:
  - Actualmente, el endpoint mapea los vehículos usando spread (`...v`), lo que expone el `dealershipId` y el `id` interno del vehículo.
  - **Corrección**: Mapear explícitamente los campos permitidos, omitiendo `dealershipId`. Devolver el `publicSlug` en lugar del `id` interno (o como campo adicional explícito).
- **`/api/public/tenant/[slug]/leads/route.ts`**:
  - El esquema Zod (`leadSchema`) actualmente acepta `vehicleId`. Se debe cambiar para aceptar `vehicleSlug`.
  - Antes de insertar el `Lead`, se debe buscar el `vehicleId` real en la base de datos usando `dealership.id` y el `vehicleSlug` recibido.

## 3. Catálogos y Funciones de Tenant (`src/lib/tenant.ts`)
- **`TenantHomeBundleVehicle`**:
  - Actualizar la interfaz para que dependa de `publicSlug` y asegurar que no haya fuga de `dealershipId`.
  - En `fetchTenantHomeBundleFromDb`, mapear los vehículos de modo que no se devuelva el `id` interno (o mapear el `id` público) al serializar el bundle cacheado.
- **Nuevas funciones**:
  - Reemplazar (o añadir) `getPublishedVehicleById` por `getPublishedVehicleBySlug(dealershipId, publicSlug)`.

## 4. Enrutamiento en `/tenant/[slug]/`
- **Renombrar directorio de rutas**:
  - Mover `src/app/tenant/[slug]/vehiculo/[id]` a `src/app/tenant/[slug]/vehiculo/[publicSlug]`.
- **Actualizar `page.tsx` del vehículo**:
  - Recibir `publicSlug` en los `params`.
  - Buscar la información utilizando el nuevo método por slug.
  - Asegurar que `TenantContactForm` reciba el `publicSlug` o `vehicleId` correcto según la necesidad del componente (idealmente, que `TenantContactForm` trabaje con el slug internamente o siga mandando id si el endpoint de leads sigue operando con id, aunque la directiva es cambiar la exposición). Como se cambiará el endpoint de leads a `vehicleSlug`, el componente deberá enviar el `vehicleSlug`.

## Conclusión
El cambio requiere modificaciones cohesivas desde la base de datos (Prisma schema y migración) hasta las rutas de API públicas y la UI (Next.js App Router). Todo el flujo de exposición pública debe ocultar identificadores internos (UUIDs y dealershipIds) y trabajar netamente con `publicSlug`.
