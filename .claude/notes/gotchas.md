# Gotchas & fixes conocidos

## Middleware — subdomain routing en localhost

**Problema:** El middleware detecta `localhost:3000` como subdominio válido y reescribe a `/tenant/localhost:3000/` → 404.

**Fix aplicado en `src/middleware.ts`:**
```ts
const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1");
if (!isLocalhost) {
  // subdomain routing solo en producción
}
```

**En producción** funciona normal: `{slug}.motorflowapp.com` → `/tenant/{slug}/`.

---

## Prisma — build scripts bloqueados por pnpm

pnpm bloquea los build scripts de `@prisma/engines` y `prisma` por defecto.

**Fix:** Correr `pnpm approve-builds` y seleccionar ambos, o agregar al `package.json`:
```json
"pnpm": {
  "onlyBuiltDependencies": ["@prisma/engines", "prisma", "@clerk/shared"]
}
```

---

## Clerk — keyless mode en desarrollo

Sin keys configuradas, Clerk arranca en "keyless mode" y auto-provee keys de dev.
Aparece el banner "Your app is ready" en la UI — es normal, no es un error.
Desaparece al configurar `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` en `.env.local`.

---

## .env files — permisos bloqueados

Claude Code bloquea escritura directa a archivos `.env*` por seguridad.
Crear `.env.local` manualmente con el contenido de `.env.example`.

---

## Auth — loop infinito login↔signup con OAuth (julio 2026)

**Problema:** intentar "crear cuenta" con Google usando una cuenta que YA existe generaba un ping-pong infinito entre `/sign-in` y `/sign-up`. Clerk crea la sesión y transfiere el flujo, pero las pages de auth no chequeaban sesión activa → el user quedaba rebotando.

**Causa raíz (tres agujeros combinados):**
1. `sign-in/[[...sign-in]]/page.tsx` y `sign-up/[[...sign-up]]/page.tsx` NO chequeaban sesión activa.
2. Redirects divergentes hardcodeados: SignIn→`/dashboard`, SignUp→`/onboarding`.
3. La onboarding page no rebotaba al que ya tenía dealership.

**Fix aplicado:**
- **Guard de sesión en ambas auth pages**: `const { userId } = await auth()` + leer el catch-all param; `if (userId && !segments) redirect("/dashboard")`. El `!segments` es CLAVE: NO dispara en sub-paths del callback OAuth (`/sign-in/sso-callback`), que deben dejar montar el widget de Clerk.
- **Redirect unificado**: ambos `fallbackRedirectUrl="/dashboard"`. El `dashboard/layout.tsx` es el ÚNICO router del estado de cuenta (sin dealership→onboarding, sin T&C→aceptar-terminos, trial vencido→cuenta-pausada). Se mantiene `fallbackRedirectUrl` (no `force`) para no pisar el `redirect_url` de invites.
- **Guard en onboarding**: `getCurrentDealership()` → si existe, `redirect("/dashboard")`.

**Gotcha no obvia:** el guard del onboarding va en la **PAGE** `(onboarding)/onboarding/page.tsx`, NO en el layout. `/aceptar-terminos` comparte el route group `(onboarding)`; si el "has dealership → /dashboard" estuviera en el layout, un user con dealership pero sin T&C haría dashboard→aceptar-terminos→(layout rebota)→dashboard→... otro loop.

---

## Tenant — link a la home se rompe en subdominio (julio 2026)

**Problema:** el botón "Inicio" (y el logo) del sitio público del tenant no navegaba EN PRODUCCIÓN (subdominio), pero sí en localhost.

**Causa:** `getTenantBasePath()` devuelve `""` en subdominio (`{slug}.motorflowapp.com`) porque las pages viven en la raíz, y `/tenant/{slug}` en localhost. Los links a la HOME usaban `href={basePath}` → en subdominio quedaba `href=""`, que el browser interpreta como "URL actual" y NO navega a `/`.

**Fix:** para cualquier link a la home usar `basePath || "/"`. Aplicado en `tenant-header.tsx` (logo, nav item "Inicio", isActive) y `tenant-footer.tsx`.

**Regla general:** los sub-links (`${basePath}/catalogo`, `${basePath}#contacto`) están OK con basePath vacío. SOLO el link bare a la home (`href={basePath}`) se rompe. Revisar esto en cualquier componente nuevo del tenant que linkee a la raíz.

---

## Auth — feedback de navegación lento sin loading.tsx (julio 2026)

**Problema:** al navegar a `/sign-up` o `/sign-in` (widgets pesados de Clerk), la pantalla quedaba "congelada" varios segundos sin feedback → se sentía roto. Peor en `pnpm dev` por la compilación on-demand.

**Fix:** agregados `src/app/sign-up/loading.tsx` y `src/app/sign-in/loading.tsx` (spinner centrado con `Loader2`). En el App Router, un `loading.tsx` crea un Suspense boundary que Next muestra AL INSTANTE en la navegación, incluso mientras compila. Patrón a replicar en cualquier ruta pesada.
