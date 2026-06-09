# SDD Spec: landing-pricing-revamp

## 1. Endpoints & API Routes

### 1.1 `POST /api/onboarding`
- **Propósito:** Crear el `Dealership` y completar la asociación `DealershipUser` tras el registro.
- **Request Body:**
  ```typescript
  {
    dealershipName: string;
    documentType: string;
    documentNumber: string;
  }
  ```
- **Lógica:**
  - Obtener el ID de usuario de Clerk de la sesión.
  - Leer la cookie temporal o el query param `selected_plan_id`.
  - Crear registro `Dealership` con estado trial o activo.
  - Crear registro `DealershipUser` asumiendo el rol de admin para este concesionario.
  - Redirigir a `/dashboard`.

## 2. Cambios en Base de Datos (Prisma)
- **Obsoletos:** Remover referencias al formulario `WaitlistEntry` de la base de código (los modelos de DB pueden migrarse después para no romper dependencias).

## 3. Manejo de Estado
- Persistencia del Plan: Al hacer clic en un CTA para empezar, se guardará el `planId` en una cookie antes de que el usuario entre al flujo de autenticación de Clerk. Tras completar el auth, se lee esta cookie en la pantalla de onboarding para preseleccionar el plan.

## 4. UI / UX Specs
- **Landing (`/`):**
  - Tarjetas de planes simplificadas.
  - Botones principales para iniciar el proceso de registro (`/sign-up`).
  - Botones secundarios de "Saber más" que enlazan a `/precios` con `target="_blank"`.
- **Página Dedicada (`/precios`):**
  - Tabla de comparación exhaustiva con todas las features (marcas de verificación/cruces).
  - CTA finales en la tabla para registrarse.
