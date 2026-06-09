# SDD Design: landing-pricing-revamp

## 1. Arquitectura de Componentes (React)

### 1.1 Componentes de UI
- **`PricingCards` (Landing)**:
  - Iterar sobre la configuración de los planes.
  - Mostrar precio, características principales en resumen.
  - Botón "Empezar" (llama a la función para setear el plan y redirigir).
  - Botón "Saber más" (`<Link href="/precios" target="_blank">`).
  - Renderizado condicional: "Potenciado por motorflow" si el plan no es enterprise.
  
- **`PricingTable` (/precios)**:
  - Extraído de la landing.
  - Grilla de features detallada.

### 1.2 Estructura de Rutas
- `src/app/(public)/page.tsx` -> Reemplazar tabla vieja por `PricingCards`.
- `src/app/(public)/precios/page.tsx` -> Nueva página conteniendo `PricingTable`.
- `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` -> Capturar query params si aplica.
- `src/app/onboarding/page.tsx` -> Vista post-registro si el usuario no tiene Dealership asociado.

## 2. Flujo de Datos
1. Usuario clickea CTA en `/` (ej. plan "Base").
2. Se ejecuta un server action o manejo de cookie: `setCookie('selected_plan', 'base')`.
3. Redirección a `/sign-up`.
4. El usuario completa el registro con Clerk.
5. Clerk redirige a `/onboarding`.
6. En `/onboarding`, la UI hace fetch de POST `/api/onboarding` enviando datos ingresados.
7. El servidor lee la cookie, crea Dealership + DealershipUser, y redirige al dashboard.
