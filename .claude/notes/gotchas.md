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
