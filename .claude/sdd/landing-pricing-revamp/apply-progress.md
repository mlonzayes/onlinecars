# Progreso: landing-pricing-revamp

## Resumen del primer batch de tareas de UI aplicado:

1. **Fase 1 completada:**
   - Se extrajo el componente compartido `Footer` de la landing page para que pueda ser reusado en la nueva ruta.
   - Se creó la ruta `/precios` (`src/app/precios/page.tsx`) que importa y utiliza el componente completo de `PricingTable` con la tabla comparativa exhaustiva.
   - Se actualizaron los enlaces en el `Navbar` y en el `Footer` para dirigir a `/precios` en vez del ancla `#planes`.

2. **Fase 2 completada:**
   - Se creó el componente `PricingCards` (`src/components/landing/pricing-cards.tsx`) como un display resumido y estético para la landing.
   - Incluye los 4 planes (Base, Media, Premium, Enterprise) mostrando la información clave y su precio.
   - El botón secundario de cada tarjeta ("Saber más") abre `/precios` en una pestaña nueva con el atributo `target="_blank"`.
   - Se incluyó dinámicamente el feature "Potenciado por motorflow" en todos los planes excepto en el "enterprise".
   - El CTA principal guarda el plan elegido en una cookie (`selected_plan_id`) y redirige automáticamente hacia `/sign-up` utilizando `useRouter` de Next.js.
   - La landing page (`src/app/page.tsx`) fue actualizada para mostrar estas tarjetas en lugar de la tabla detallada.

Las fases 1 y 2 fueron marcadas como completadas en el `tasks.md`.

3. **Fase 3 completada (Feedback aplicado):**
   - Se eliminó toda la lógica de pre-registro y waitlist en base al feedback del usuario.
   - Se crearon los endpoints (`/api/public/contact`) y componentes (`LandingContactForm`) para solicitar contrataciones o realizar consultas desde la landing page.
   - Se actualizó el código de `src/app/page.tsx`, `Navbar`, `Footer`, y otros menús para apuntar a la nueva sección `#contacto` en vez de `#pre-registro`.
   - Se marcó la fase 3 como finalizada en `tasks.md`. Todo el flujo principal de precios y onboarding/contacto está implementado.
