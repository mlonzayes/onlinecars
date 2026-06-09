# SDD Tasks: landing-pricing-revamp

## Fase 1: Extracción y Nueva Página (`/precios`)
- [x] Crear la ruta `src/app/(public)/precios/page.tsx`.
- [x] Mover la tabla de precios detallada (`PricingTable`) a la nueva ruta.
- [x] Actualizar enlaces en el Navbar y Footer para que "Precios" apunte a `/precios`.

## Fase 2: Componente PricingCards en Landing
- [x] Implementar un componente simplificado `PricingCards` en la landing (`src/app/(public)/page.tsx`).
- [x] Mostrar en las tarjetas la info básica y el precio.
- [x] Incluir el botón "Saber más" que abra `/precios` en una nueva pestaña (`target="_blank"`).
- [x] Inyectar el texto "Potenciado por motorflow" condicionalmente si el plan no es "enterprise".
- [x] Configurar el CTA principal "Empezar" para que guarde el plan seleccionado (ej. en una cookie) y redirija a `/sign-up`.

## Fase 3: Formulario de Contacto (Reemplazo de Pre-registro/Waitlist)
- [x] Eliminar los componentes y rutas del waitlist/pre-registro.
- [x] Crear el formulario `LandingContactForm` para consultar o contratar planes.
- [x] Crear el endpoint `POST /api/public/contact` para procesar el formulario y enviar notificación.
- [x] Actualizar la landing y menús para reemplazar "Pre-registro" por "Contacto".
