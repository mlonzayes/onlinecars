# Progreso de Implementación: Isolation y Slugs

## Estado General
- [x] Fase 1: Capa Base y Esquema de Datos completada.
- [x] Fase 2: Script de Migración (Backfill) completada.
- [ ] Fase 3: Capa de APIs y Tipos pendiente.
- [ ] Fase 4: Frontend y Enrutamiento pendiente.
- [ ] Fase 5: Verificación y QA pendiente.

## Resumen de Cambios
- Se creó `src/lib/utils/slug.ts` utilizando `crypto` (en lugar de nanoid para no sumar dependencias) para generar el slug de forma determinista y segura (`[marca]-[modelo]-[año]-[hash-4bytes]`).
- Se agregó el campo `publicSlug` al modelo `Vehicle` en `prisma/schema.prisma` y se ejecutó la migración inicial.
- Se implementó y ejecutó el script `scripts/backfill-slugs.ts` para rellenar los slugs de todos los vehículos existentes en la base de datos (con Prisma Client compilado).
- Se aplicó la restricción `@@unique([dealershipId, publicSlug])` y se quitó el default empty string. Se está corriendo la migración final de constraints en la base de datos.
- Todo listo para comenzar la Fase 3 y ajustar la capa de APIs y de presentación.
