# SDD Explore: landing-pricing-revamp

## 1. Contexto y Objetivos
El objetivo principal es evolucionar la landing page de motorflow pasando de un esquema de "lanzamiento próximo / pre-registro" a un modelo de autoservicio y suscripción real. Se requieren tres modificaciones puntuales:
1. Mover la tabla de precios desde la landing (`/`) a una página exclusiva (ej. `/precios`).
2. Incluir la leyenda "Potenciado por motorflow" en las tarjetas de presentación de los planes Base, Media y Premium (excepto Enterprise).
3. Eliminar el formulario "Lanzamos pronto" y reemplazarlo por un flujo de alta/registro real de cuentas.

## 2. Análisis del Código y Estado Actual

### 2.1 Componentes UI
- **Landing Page (`src/app/page.tsx`):**
  Actualmente contiene `PricingSection` y `PreRegistroSection`. Enlaza con `#planes` y `#pre-registro`.
- **Tabla de Precios (`src/components/landing/pricing-table.tsx`):**
  Renderiza las columnas de los planes y las "features" comparativas. Las CTA actuales apuntan a `#pre-registro`.
- **Formulario Waitlist (`src/components/shared/waitlist-form.tsx`):**
  Se encarga de guardar interesados en la lista de espera conectándose con `/api/waitlist`.

### 2.2 Modelos de Prisma (`prisma/schema.prisma`)
- **`WaitlistEntry`:** Modelo usado para el pre-registro. Almacena emails, nombres y teléfonos de interesados bajo un estado (`pending`, `invited`, `accepted`, `rejected`).
- **`Dealership` y `DealershipUser`:** Modelos que representan un concesionario real y su vínculo con un usuario de Clerk. `Dealership` ya tiene el campo `plan` (`base`, `media`, `premium`, `enterprise`) y un `subscriptionStatus`.

## 3. Enfoques Recomendados

### Fase 1: Nueva Página de Precios (`/precios`)
- Mover `PricingSection` y `PricingTable` desde `page.tsx` hacia una nueva ruta `src/app/precios/page.tsx`.
- Actualizar los enlaces de la landing (`Navbar`, `Footer`, y CTA del `HeroSection`) para que dirijan a `/precios` en lugar de anchors como `#planes`.

### Fase 2: Ajustes en UI de Planes ("Potenciado por motorflow")
- En `PricingTable`, dentro del map que renderiza las cabeceras/tarjetas de los planes, agregar una condición: si el plan **no es** "enterprise", mostrar la etiqueta o texto "Potenciado por motorflow".
- Actualizar las descripciones o features para reflejar la consistencia de la marca en base a esta leyenda si fuera necesario.

### Fase 3: Flujo de Alta Real (Reemplazo del Pre-registro)
- Eliminar `PreRegistroSection` y el uso de `WaitlistForm`.
- Deprecar/eliminar el modelo `WaitlistEntry` si ya no se usará (o mantenerlo como histórico sin exponerlo en la web).
- Crear un flujo de alta (ej. un modal, página `/signup` o redirigir al flujo de Clerk). 
- Al hacer clic en un plan (Base, Media, Premium) en la tabla de precios, redirigir al usuario al flujo de creación de cuenta pasando el plan como parámetro (ej. `/registro?plan=media`).
- Una vez logueado vía Clerk, si el usuario no tiene un `Dealership` asignado, llevarlo por el onboarding para crear el registro en la tabla `Dealership` con su `DealershipUser` y el `plan` elegido.

## 4. Riesgos y Consideraciones
- **Base de datos:** Si se elimina `WaitlistEntry`, crear una migración de Prisma asegurándose de no perder datos importantes de leads anteriores, o exportarlos antes. Si no se elimina, se debe sacar de la UI pública.
- **Auth (Clerk):** El onboarding real interactuará directamente con Clerk y la base de datos de producción para inicializar `Dealerships` completos, algo que antes era un proceso interno o manejado vía invitaciones. Hay que asegurar que los registros se inicialicen como `trial`.
