# SDD Proposal: landing-pricing-revamp

## Resumen Ejecutivo
Basado en el descubrimiento previo y el feedback del usuario, vamos a dejar de lado la etapa de "lanzamos pronto" para pasar a un producto SaaS real, con un flujo de alta directo. Esto implica mantener tarjetas simples de planes en la landing principal, pero mover la tabla comparativa detallada a una página exclusiva (`/precios`). Además, ajustaremos el pricing component para reforzar el branding de motorflow en los planes menores, y reemplazaremos el viejo `WaitlistEntry` por un alta real conectada a Clerk y nuestra base de datos.

## 1. Nueva Estructura de Rutas y UI de Precios
**El Problema:** Actualmente, la landing (`/`) está sobrecargada con una sección de precios compleja (`#planes`), lo cual no escala y perjudica el SEO y la conversión.
**La Solución (UI/UX Feedback):** 
- Mantener una sección de precios en la landing principal (`/`) pero simplificada: mostrar únicamente tarjetas (cards) con el resumen de cada plan.
- Cada tarjeta de plan en la landing tendrá un botón "Saber más".
- Al hacer clic en "Saber más", el usuario será redirigido a una nueva ruta dedicada y en una pestaña aparte: `src/app/(public)/precios/page.tsx`.
- En esta nueva página (`/precios`) se alojará la tabla comparativa grande y detallada de todas las features por plan.

## 2. Ajustes en UI: "Potenciado por motorflow"
**El Problema:** Necesitamos diferenciar el plan Enterprise (marca blanca completa) de los planes estándar (Base, Media, Premium) donde motorflow mantiene presencia de marca.
**La Solución:** 
- Modificar los componentes de tarjetas de planes.
- En el renderizado de las tarjetas de planes, agregar un chequeo condicional: `plan.id !== 'enterprise'`.
- Si se cumple la condición, inyectar un elemento visual sutil con el texto "Potenciado por motorflow" asegurando la cohesión con nuestro sistema de diseño.

## 3. Diseño Técnico del Flujo de Alta Real (Tenant Sign-up)
**El Problema:** El `WaitlistEntry` quedó obsoleto; necesitamos un onboarding de concesionarias self-service.
**La Solución:**
1. **Punto de Entrada:** Los CTA de las tarjetas y de la tabla comparativa apuntarán al inicio de registro pasando el plan deseado (ej. `/sign-up?plan={planId}`).
2. **Registro y Persistencia del Plan:** 
   - Guardar el `planId` en una cookie temporal o en `publicMetadata` / `unsafeMetadata` de Clerk al iniciar el flujo para no perder el contexto después del redirect de autenticación.
   - Usar componentes de Clerk (`<SignUp />`) o Custom Flow para autenticar al `DealershipUser`.
3. **Onboarding del Concesionario:**
   - Clerk redirigirá (vía `fallbackRedirectUrl` o webhook) a la ruta de onboarding (ej. `/onboarding`).
   - El usuario completará los datos del concesionario (Nombre de fantasía, etc.).
   - Al enviar el form, una API route transaccional va a:
     - Validar que el usuario (Clerk) exista y no tenga ya un concesionario.
     - Crear un `Dealership` (asociándole el `plan` recuperado del contexto y estado `trial`).
     - Crear la relación `DealershipUser`.
4. **Limpieza (Tech Debt):**
   - Eliminar de la base de código `WaitlistForm` y la sección de pre-registro.
   - En una migración futura, se eliminará o depreciará `WaitlistEntry` de la DB, ya que no tendrá uso público.

## 4. Riesgos
- **Pérdida del Plan Elegido:** Si el usuario usa un proveedor OAuth (ej. Google) y sale de nuestra app, debemos garantizar que al volver (callback) el plan que eligió siga disponible (uso de cookies es lo más robusto).

**Próximo paso recomendado:** Ejecutar `sdd-spec` para definir al detalle los endpoints, esquemas de base de datos exactos (si hubiere cambios) y las interfaces del onboarding.
