# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# motorflow — Plataforma SaaS para Concesionarios de Autos

## Descripción General

**motorflow** es una plataforma SaaS multi-tenant que permite a concesionarios de autos tener su propio sitio web profesional con catálogo de vehículos, gestión de stock, captación de leads y operatoria de venta (clientes, ventas, legajo de documentos). Cada concesionario obtiene un sitio personalizado con su branding, dominio propio, y un panel de administración.

**Target:** Concesionarios medianos y chicos de Argentina que hoy dependen de MercadoLibre/portales y no tienen presencia web propia.

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15.5 (App Router) |
| Runtime React | React 18.3 |
| Lenguaje | TypeScript 5 (strict mode) |
| Auth | Clerk (`@clerk/nextjs` v7) |
| Base de datos | Neon (PostgreSQL serverless) vía `@neondatabase/serverless` |
| ORM | Prisma 7 con `@prisma/adapter-neon` |
| Cache / rate-limit | Upstash Redis (`@upstash/redis`) + `@upstash/ratelimit`. Rate limiting activo en `/api/public/*`. Cache del catálogo aún pendiente. |
| Estilos | Tailwind CSS v4 + shadcn/ui (Base UI por debajo) |
| Deploy | Vercel |
| Storage (archivos) | Abstracción driver-based en `lib/storage/` (`local` por default, `s3` para prod). S3 vía AWS SDK v3 (`@aws-sdk/client-s3` + presigner). S3-compatible probado con Contabo Object Storage; también soporta R2/AWS. Dos buckets: público (imágenes catálogo) + privado (documentos legajo, presigned URLs). |
| Email transaccional | Resend (instalado, no integrado todavía) |
| Validación | Zod 4 |
| Notifications UI | Sonner |
| State management | Solo Zustand si es estrictamente necesario (aún no instalado) |
| Testing | **No configurado todavía.** No hay Vitest/Playwright instalados. Las reglas en `.claude/rules/testing.md` son aspiracionales hasta que se setee. |

## Comandos

Package manager: **pnpm**.

```bash
pnpm dev            # Next.js dev server (http://localhost:3000)
pnpm build          # Build de producción
pnpm start          # Levanta el build
```

**No hay scripts de `lint`, `typecheck` ni `test` definidos en `package.json`** — si necesitás chequear tipos, corré `pnpm exec tsc --noEmit`. Si vas a agregar testing o lint, primero pedile al usuario que confirme el setup.

### Prisma

```bash
pnpm exec prisma generate                          # Regenera el client
pnpm exec prisma migrate dev --name <nombre>       # Nueva migración en dev
pnpm exec prisma migrate deploy                    # Aplica migraciones en prod
pnpm exec prisma studio                            # GUI de la DB
```

Hay un `prisma.config.ts` en la raíz del repo. Las migraciones existentes viven en `prisma/migrations/`. No hay archivo `prisma/seed.ts` ni script de seed configurado todavía. La carpeta `scripts/` está reservada para utilidades — pegarle una mirada antes de crear scripts nuevos.

## Arquitectura

### Multi-tenancy

El modelo de multi-tenancy se resuelve por **subdomain routing** (default domain `motorflowapp.com`, configurable vía `NEXT_PUBLIC_APP_DOMAIN`):

```
{slug}.motorflowapp.com  → Sitio público del concesionario (rewrite a /tenant/{slug})
app.motorflowapp.com     → Panel de administración (dashboard)
motorflowapp.com         → Landing pública (waitlist) + onboarding + sign-in
```

El subdomain rewrite vive en [src/middleware.ts](src/middleware.ts) y **solo se activa fuera de `localhost`**. En dev se trabaja todo desde `localhost:3000` accediendo a `/dashboard`, `/tenant/{slug}`, etc. directamente.

### Feature flag global de login: `NEXT_PUBLIC_ENABLE_LOGIN`

Mientras el producto no esté abierto, el dashboard está gateado por este flag:

- Si `NEXT_PUBLIC_ENABLE_LOGIN !== "true"`, el middleware NO protege rutas y el layout del dashboard redirige a `/`.
- En ese estado, la app funciona como landing pura con la waitlist.
- Cualquier cambio en flow de auth tiene que respetar este gate.

### Estructura de la App (App Router) — estado real

```
src/
├── app/
│   ├── page.tsx                     # Landing pública con waitlist (sin route group)
│   ├── layout.tsx                   # Root layout
│   ├── providers.tsx                # Providers globales (Clerk, theme, etc.)
│   ├── dashboard/                   # Panel admin — gateado por NEXT_PUBLIC_ENABLE_LOGIN
│   │   ├── layout.tsx               # Sidebar + header + verificación de Dealership
│   │   ├── page.tsx                 # Dashboard home
│   │   ├── vehiculos/               # CRUD de vehículos (list, [id], nuevo)
│   │   ├── leads/                   # Gestión de consultas
│   │   ├── clientes/                # CRUD de clientes (list, [id], nuevo)
│   │   ├── ventas/                  # CRUD de ventas (list, [id], nueva)
│   │   ├── sitio-web/               # Personalización del sitio público (theme, branding)
│   │   └── configuracion/           # Settings del concesionario
│   ├── (onboarding)/onboarding/     # Crea Dealership inicial al loguearse
│   ├── sign-in/[[...sign-in]]/      # Clerk sign-in
│   ├── tenant/[slug]/               # Sitio público del concesionario (target del rewrite)
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Catálogo público
│   │   └── vehiculo/[id]/           # Detalle público
│   └── api/
│       ├── waitlist/                # POST público para landing
│       ├── onboarding/              # POST: crear Dealership + DealershipUser
│       ├── concesionario/           # GET/PUT del dealership actual + /theme
│       ├── vehiculos/               # GET, POST + [id] (GET/PUT/DELETE)
│       │   └── [id]/
│       │       ├── publish/         # PATCH toggle publicado
│       │       ├── featured/        # PATCH toggle destacado
│       │       ├── status/          # PATCH cambiar status (bloqueado si hay venta activa)
│       │       └── images/          # POST + [imageId] (DELETE) + /order (PUT reordenar)
│       ├── leads/                   # GET + [id] (GET/PATCH/DELETE)
│       ├── clientes/                # GET, POST + [id] (GET/PUT/DELETE)
│       ├── ventas/                  # GET, POST + [id] (GET/PATCH/DELETE) + [id]/status
│       │   └── [id]/documentos/     # GET, POST + [docId] (DELETE) + [docId]/url (GET presigned)
│       ├── dashboard/reviews/[id]/  # PATCH (moderar) + DELETE
│       └── public/                  # Endpoints SIN auth — sitio del tenant + landing
│           └── tenant/[slug]/
│               ├── vehicles/        # GET catálogo
│               ├── leads/           # POST consulta
│               └── reviews/         # POST opinión (entra como pending)
├── components/
│   ├── ui/                          # shadcn/ui
│   ├── dashboard/                   # sidebar, header, *-form, *-table, *-detail-sheet, settings/*, vehicle-image-uploader, sale-documents
│   ├── tenant/                      # Componentes del sitio público (catálogo, contact-form, review-form, etc.)
│   └── shared/                      # navbar, waitlist-form
├── lib/
│   ├── prisma.ts                    # Singleton con PrismaNeon adapter
│   ├── redis.ts                     # Upstash Redis REST client
│   ├── rate-limit.ts                # 4 limiters Upstash + applyRateLimit() helper (fail-open)
│   ├── honeypot.ts                  # HONEYPOT_FIELD + isHoneypotTriggered() para anti-bots
│   ├── auth.ts                      # getCurrentDealership() — resuelve Dealership del user logueado
│   ├── tenant.ts                    # Queries para sitio público (getDealershipBySlug, getPublishedVehicles, ...)
│   ├── api-handler.ts               # withLogger() — wrapper para route handlers (ver sección API)
│   ├── logger.ts                    # JSON structured logger + generateRequestId()
│   ├── sale-guards.ts               # findBlockingSale() — bloquea ediciones del vehículo si hay venta activa
│   ├── storage/                     # Abstracción de storage (local | s3) — index, types, local.ts, s3.ts
│   ├── utils.ts                     # cn() y helpers
│   ├── validators/                  # Schemas Zod (vehicle, vehicle-image, lead, customer, sale, sale-document, dealership, review, waitlist)
│   └── constants.ts                 # `as const` lists (FUEL_TYPES, STATUSES, PROVINCIAS_ARGENTINA, etc.)
├── hooks/                           # use-mobile.ts (otros se irán sumando)
├── data/                            # brands.json — datos estáticos de marcas
├── types/index.ts                   # ApiResponse, ApiListResponse, ApiError, DealershipTheme
├── middleware.ts                    # Subdomain routing + Clerk auth (con flag de login)
└── prisma/
    ├── schema.prisma
    └── migrations/
```

**Pendientes conocidos** (no existen aún en `src/`):
- Webhooks de Clerk en `/api/webhooks/clerk/` para sync de usuarios (delete/rename).
- Cache Redis del catálogo público + invalidación.
- Email transaccional con Resend (deps instaladas, sin uso).
- CSP (`Content-Security-Policy`) — los demás headers de seguridad ya están, este queda para una iteración aparte con tuneo Clerk-friendly en modo report-only primero.

## Convenciones de Código

### General

- **Idioma del código:** Inglés (variables, funciones, componentes, commits).
- **Idioma de UI/UX:** Español (textos, labels, mensajes al usuario).
- **Idioma de comentarios:** Español (breve y solo cuando el código no es autoexplicativo).
- **TypeScript strict:** Siempre. Nada de `any` — usar `unknown` + type guards si es necesario.
- **No usar `enum`:** Preferir `as const` + tipo derivado.

### Naming

| Qué | Convención | Ejemplo |
|---|---|---|
| Archivos de componentes | kebab-case | `vehicle-card.tsx` |
| Componentes React | PascalCase | `VehicleCard` |
| Funciones/variables | camelCase | `getVehicleById` |
| Constantes | UPPER_SNAKE_CASE | `MAX_IMAGES_PER_VEHICLE` |
| Tipos/Interfaces | PascalCase con prefijo descriptivo | `VehicleCreateInput` |
| API Routes | kebab-case en español en la URL | `/api/vehiculos/[id]`, `/api/clientes`, `/api/ventas` |
| Tablas Prisma | PascalCase singular | `model Vehicle {}` |
| Columnas Prisma | camelCase | `createdAt`, `fuelType` |
| Archivos de hooks | use-{nombre}.ts | `use-vehicles.ts` |

> **Ojo con el idioma de las URLs.** Los segmentos de API y dashboard están en español (`/api/vehiculos`, `/dashboard/clientes`, `/dashboard/ventas`) — los endpoints públicos siguen el mismo patrón pero los recursos internos usan inglés en el path: `/api/public/tenant/[slug]/vehicles`. Mantener este split: español para el panel del concesionario, inglés para los endpoints públicos del tenant.

### Componentes React

- Siempre **funciones** (no arrow functions exportadas como default para componentes de página).
- Props tipadas con `interface` en el mismo archivo si son simples, en `types/` si se reusan.
- Usar `"use client"` solo cuando sea estrictamente necesario.
- Preferir **Server Components** por defecto.
- Separar lógica de fetch en funciones en `lib/` o `actions/`.

```tsx
// ✅ Correcto
interface VehicleCardProps {
  vehicle: Vehicle;
  onContact?: () => void;
}

export function VehicleCard({ vehicle, onContact }: VehicleCardProps) {
  return (/* ... */);
}

// ❌ Incorrecto
export default ({ vehicle, onContact }: any) => { /* ... */ };
```

### API Routes

Convenciones generales:
- Usar Route Handlers de Next.js (`route.ts`).
- Siempre validar input con Zod antes de tocar la DB.
- Endpoints autenticados: verificar auth con Clerk (`auth()` o `currentUser()`) y resolver el dealership con `getCurrentDealership()` de [src/lib/auth.ts](src/lib/auth.ts).
- Endpoints públicos viven bajo `/api/public/...` y resuelven el tenant por `slug` (no por user).
- **CRÍTICO:** toda query a DB en endpoints autenticados DEBE filtrar por `dealershipId`. Nunca exponer datos de otro tenant.

Formato de respuesta:

```ts
// ✅ Éxito
return NextResponse.json({ data: vehicle }, { status: 200 });
// ✅ Lista
return NextResponse.json({ data: items, meta: { total, page, limit } });
// ✅ Error
return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
```

#### Wrapper `withLogger` (convención del proyecto)

Todos los handlers nuevos deben envolverse con `withLogger` de [src/lib/api-handler.ts](src/lib/api-handler.ts). El wrapper:

1. Resuelve un `requestId` (toma el header `x-request-id` si vino o genera uno con formato `YYYYMMDDHHmmssSSS_<hex8>`).
2. Loggea `request.start` antes y `request.end` después con `durationMs` y status.
3. Captura excepciones no manejadas y devuelve un 500 estructurado con el `requestId`.
4. Propaga el `x-request-id` en el header de la respuesta.
5. Resuelve `params` (que en Next.js 15 son `Promise`) y los pasa al handler tipados.

Patrón:

```ts
import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";

type RouteParams = { id: string };

export const GET = withLogger<RouteParams>(async (request, { requestId, params }) => {
  // params ya está awaited y tipado
  // Usar logger.info/warn/error con requestId para trazabilidad
  logger.info(requestId, "vehiculos.detail", { id: params.id });
  return NextResponse.json({ data: /* ... */ });
});
```

Para logging usar SIEMPRE el `logger` de [src/lib/logger.ts](src/lib/logger.ts) (JSON estructurado), nunca `console.log`. Las claves de evento son `dot.case` (`public.leads.created`, `vehiculos.image.uploaded`, etc.).

#### Rate limiting + honeypot en endpoints públicos

Todo handler nuevo bajo `/api/public/*` (y `/api/waitlist`) debe aplicar **rate limiting** Y **honeypot**, en ese orden, antes de cualquier validación o acceso a DB. Helpers:

- [src/lib/rate-limit.ts](src/lib/rate-limit.ts) — 4 limiters preconfigurados (`publicLeadsLimiter`, `publicReviewsLimiter`, `publicVehiclesLimiter`, `waitlistLimiter`). Usan `Ratelimit.slidingWindow` de `@upstash/ratelimit`. Función `applyRateLimit(limiter, key, requestId, context)` devuelve `{ ok, headers }`. **Fail-open**: si Upstash está caído, deja pasar y loggea (preferimos servicio sin rate limit a servicio caído).
- [src/lib/honeypot.ts](src/lib/honeypot.ts) — `HONEYPOT_FIELD = "website"`, `isHoneypotTriggered(body)`. Si trigger: loggear `*.honeypot_triggered` y devolver **201 fake** con UUID random (NO 4xx — no enseñar al bot).

**Key del rate limit**:
- Endpoints con tenant: `${ip}:${slug}` para que un tenant no consuma cupo de otro.
- Endpoints sin tenant (waitlist): solo `${ip}`.
- IP se extrae con `getClientIp(request)` (lee `x-forwarded-for` con fallback).

**Importante**: los headers `X-RateLimit-*` se devuelven SIEMPRE (éxito y error) en `NextResponse.json(..., { headers: rl.headers })` para que el cliente sepa cuántas requests le quedan. En 429 se suma `Retry-After`.

Patrón completo (ver [src/app/api/public/tenant/[slug]/leads/route.ts](src/app/api/public/tenant/[slug]/leads/route.ts) como referencia):

```ts
const ip = getClientIp(request);
const rl = await applyRateLimit(publicLeadsLimiter, `${ip}:${slug}`, requestId, { slug });
if (!rl.ok) {
  return NextResponse.json({ error: "..." }, { status: 429, headers: rl.headers });
}

const body = await request.json();

if (isHoneypotTriggered(body)) {
  logger.warn(requestId, "public.x.honeypot_triggered", { ... });
  return NextResponse.json({ data: { id: globalThis.crypto.randomUUID() } }, { status: 201, headers: rl.headers });
}

// Recién acá: Zod parse, DB, etc.
```

### Headers de seguridad

Definidos en [next.config.ts](next.config.ts) → función `headers()`. Aplican a TODAS las respuestas:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN` (anti-clickjacking)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), ...`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` — **solo en `NODE_ENV=production`** (en dev rompe localhost).

**`Content-Security-Policy` está pendiente** — armarlo bien con Clerk requiere modo `Report-Only` primero, recopilar violaciones, tunear, y recién después aplicar enforcing.

### Storage de archivos

La abstracción vive en [src/lib/storage/](src/lib/storage/). El driver activo se decide por env:

- `STORAGE_DRIVER=local` (default) → guarda en filesystem local. **No funciona en Vercel** (filesystem read-only en runtime). Sirve solo para dev.
- `STORAGE_DRIVER=s3` → S3-compatible (Cloudflare R2 esperado). Antes de deploy a prod hay que setearlo y crear los dos buckets (público + privado).

Nunca importar `s3.ts` o `local.ts` directo desde un handler — usar `import { storage } from "@/lib/storage"` para que el driver sea transparente.

**Separación pública/privada (importante):**

- `storage.upload(...)` → **imágenes del catálogo** → bucket público. La URL devuelta es directa y permanente (custom domain de R2). Se guarda en `VehicleImage.url` y se sirve directo al visitante.
- `storage.uploadDocument(...)` → **documentos del legajo de venta** (DNI, F08, factura, etc.) → bucket privado. Son datos personales sensibles — NO son accesibles directo. La columna `SaleDocument.url` queda con un identificador interno que NUNCA debe usarse desde el front.
- `storage.delete(key, kind)` → segundo argumento `"image" | "document"` indica de qué bucket borrar. Es obligatorio.
- `storage.getDocumentUrl(key, ttl?)` → genera presigned URL para descargar un documento (TTL default 5 min en S3; en local devuelve la ruta pública).

Para servir documentos al front: usar el endpoint `GET /api/ventas/[id]/documentos/[docId]/url` que valida el tenant y devuelve `{ data: { url } }`. **No exponer `SaleDocument.url` directo en componentes** — siempre pasar por ese endpoint para que el driver decida.

Validaciones de formato/tamaño viven en cada endpoint de upload con magic-number check (no confiar solo en el header `Content-Type` del browser). Ver [src/lib/validators/vehicle-image.ts](src/lib/validators/vehicle-image.ts) y [src/lib/validators/sale-document.ts](src/lib/validators/sale-document.ts).

### Prisma

- Un solo archivo `schema.prisma`.
- **Convención adoptada:** TODOS los modelos usan `@@map` para mapear a `snake_case` en la DB (ej: `model Dealership { @@map("dealerships") }`). Las columnas se mantienen en `camelCase` en el cliente Prisma.
- Client singleton en [src/lib/prisma.ts](src/lib/prisma.ts) usando `PrismaNeon(neon(DATABASE_URL))` — **siempre usar este import**, no instanciar `PrismaClient` directo.
- Migraciones con nombres descriptivos: `pnpm exec prisma migrate dev --name add_vehicle_images`.
- `onDelete` adoptados en el schema:
  - Relaciones a `Dealership` → `Cascade` (borrar el tenant borra todo lo suyo, incluido `Review` y `FinancingPlan`).
  - `Lead.vehicle` → `SetNull` (preservar el lead si se borra el vehículo).
  - `Sale.vehicle` y `Sale.customer` → `Restrict` (no se puede borrar un vehículo o cliente con venta asociada).
  - `SaleDocument.sale` → `Cascade`.
- **`Sale.vehicleId` NO es `@unique` declarativo**: un vehículo puede tener varias ventas históricas canceladas + máximo UNA activa. La unicidad se enforza con un **partial unique index en SQL** (`UNIQUE WHERE status != 'cancelled'`) implementado en la migración [20260429004500_add_partial_unique_active_sale](prisma/migrations/20260429004500_add_partial_unique_active_sale/). Prisma 7 no soporta partial unique declarativo. Si se cancela una venta queda `status: cancelled` con `cancelReason` y libera al vehículo para una nueva venta.
- `Customer` tiene `@@unique([dealershipId, documentType, documentNumber])`.

### Git

- **Commits en inglés** con conventional commits:
  - `feat: add vehicle catalog page`
  - `fix: resolve image upload on mobile`
  - `chore: update prisma schema`
  - `refactor: extract vehicle service layer`
- **Branches:** `feature/{nombre}`, `fix/{nombre}`, `chore/{nombre}`
- **PR titles** siguen la misma convención.

## Patrones para nuevas pantallas del dashboard

Cuando armes una pantalla nueva de listado en `/dashboard/...` (ej: vehículos, leads, ventas, cotizaciones, clientes), seguí estos patterns que ya están consolidados en las pantallas existentes. **Mirá `sales-table.tsx` o `quotations-table.tsx` como referencia** — están al día.

### 1. Stats cacheados con `unstable_cache` + `revalidateTag`

Los contadores de los stat cards (Total, En curso, Completadas, etc) no se calculan en cada request. Usá `unstable_cache` con un tag, e invalidá ese tag en CADA endpoint que mute el recurso.

```ts
// page.tsx (server)
const getCachedStats = unstable_cache(
  async (dealershipId: string) => {
    const [total, active] = await Promise.all([
      prisma.sale.count({ where: { dealershipId } }),
      prisma.sale.count({ where: { dealershipId, status: { in: [...] } } }),
    ]);
    return { total, active };
  },
  ["sales-stats"],                          // ← cache key
  { tags: ["sales-stats"], revalidate: 3600 } // ← tag para invalidar
);

// /api/ventas/route.ts (POST, PATCH, DELETE, status, etc)
import { revalidateTag } from "next/cache";
// ...después de la mutación
revalidateTag("sales-stats");
```

**Optimización**: cuando el paginador necesita un `count(where)` pero NO hay filtros activos, derivá `total` del cache en lugar de correr el count:

```ts
const [stats, sales, filteredCount] = await Promise.all([
  getCachedStats(dealership.id),
  prisma.sale.findMany({ where, skip, take }),
  hasFilters ? prisma.sale.count({ where }) : Promise.resolve(0),
]);
const total = hasFilters ? filteredCount : stats.total;
```

### 2. Filtros y search en searchParams (no en useState)

Los filtros y la búsqueda viven en la URL para que sean bookmarkables, soporten back/forward del browser y permitan SSR. **No usar `useState` en el client para filtros**.

- **Server page**: lee `searchParams.q`, `searchParams.status`, etc, y los pasa al `where` de Prisma.
- **Client component**: filtros y search **modifican la URL** (`router.push` o `<Link>`), no estado local.
- **Reset de `page`**: al cambiar un filtro, siempre borrá `?page` (volver a página 1).

Ej de un Select de URL — ver [src/components/dashboard/sales-status-select.tsx](src/components/dashboard/sales-status-select.tsx):

```ts
function handleChange(next: string | null) {
  const params = new URLSearchParams(searchParams?.toString());
  if (next === "all") params.delete("status");
  else params.set("status", next);
  params.delete("page");
  router.push(qs ? `/dashboard/x?${qs}` : "/dashboard/x");
}
```

### 3. Search con tokens + AND/OR

`TableSearch` ya existe y postea `?q=...` a la URL. En el server tokenizá la query y exigí AND de matches en algún campo, con OR de campos relevantes (incluí relaciones cuando aplique — Prisma las soporta).

```ts
const tokens = search.split(/\s+/).filter(Boolean);
const where = {
  dealershipId,
  ...(tokens.length > 0 ? {
    AND: tokens.map(token => ({
      OR: [
        { name: { contains: token, mode: "insensitive" as const } },
        { customer: { firstName: { contains: token, mode: "insensitive" as const } } },
        { vehicle: { licensePlate: { contains: token, mode: "insensitive" as const } } },
      ],
    })),
  } : {}),
};
```

Sin tokens, no se sumas filtros — el `count` se puede derivar del cache.

### 4. Bulk selection con plan gating

Si la pantalla soporta seleccionar varios items y hacer una acción masiva:

- Estado local: `selectedIds: Set<string>`, `bulkLoading: boolean`.
- Checkbox master con `indeterminate` cuando hay selección parcial.
- Toolbar visible solo cuando `selectedCount > 0`.
- **Plan gating**: chequear `limits.allowBulkActions` en los toggles ANTES de mutar el set. Si no tiene plan, mostrar toast de upgrade:

```ts
function toggleSelect(id: string) {
  if (!limits.allowBulkActions) {
    toast("Mejorá tu plan", { description: "Disponible a partir del plan Media." });
    return;
  }
  // ...mutar el set
}
```

La page server debe pasar `limits={getPlanLimits(dealership)}` (de [src/lib/plans.ts](src/lib/plans.ts)) al client.

- **Bulk operations**: usar `Promise.allSettled` (no `Promise.all`) para que un fallo no aborte los demás. Reportar éxitos y fallos por separado en el toast.

```ts
const results = await Promise.allSettled(ids.map(id => fetch(...)));
const failed = results.filter(r => r.status === "rejected" || !r.value.ok).length;
const ok = ids.length - failed;
if (ok > 0) toast.success(...);
if (failed > 0) toast.error(`${failed} fallaron (transición no permitida)`);
```

**Defense in depth**: el plan gating es client-side. Si hace falta defender server-side (raro, porque los recursos son del propio tenant), agregá el chequeo en el handler también.

### 5. ConfirmDialog en lugar de `window.confirm()`

**Nunca** usar `confirm()` o `alert()` nativos del browser para confirmaciones. **Siempre** usar [src/components/ui/confirm-dialog.tsx](src/components/ui/confirm-dialog.tsx). Convención del proyecto — verificar en code review. Si en algún momento se setea ESLint, agregar `no-restricted-globals` para `confirm` y `alert` para enforce automático.

#### Patrón completo (state + trigger + handler + render)

```tsx
// 1. State — `id` para acciones por-item, boolean para acciones singleton/bulk
const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

// 2. Trigger — el onClick del botón rojo SOLO abre el dialog, no ejecuta la acción
<DropdownMenuItem onClick={() => setConfirmDeleteId(item.id)}>
  Eliminar
</DropdownMenuItem>

// 3. Handler separado — lo que antes era `handleDelete(id)` con confirm() inline,
//    ahora es una función sin parámetros que lee del state
async function handleDeleteConfirmed() {
  if (!confirmDeleteId) return;
  const id = confirmDeleteId;
  try {
    const res = await fetch(`/api/recurso/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Error al eliminar");
      return;
    }
    toast.success("Eliminado");
    router.refresh();
  } finally {
    setConfirmDeleteId(null);
  }
}

// 4. Dialog — al FINAL del JSX, fuera del DropdownMenu/Sheet/Drawer
<ConfirmDialog
  open={confirmDeleteId !== null}
  onOpenChange={(open) => !open && setConfirmDeleteId(null)}
  title="Eliminar vehículo"
  description="Esta acción no se puede deshacer. Se eliminarán también todas sus imágenes."
  confirmLabel="Eliminar"
  destructive
  onConfirm={handleDeleteConfirmed}
/>
```

#### Reglas no obvias

- **El dialog se renderiza al nivel raíz del componente**, no dentro del item de la tabla. Si lo metés dentro del `<TableRow>` o `<DropdownMenu>`, se desmonta cuando el menú se cierra y nunca llega a abrirse.
- **`onConfirm` puede ser async** — el componente maneja su propio loading state, muestra spinner en el botón y deshabilita ambos botones hasta que resuelva. NO setees loading externo.
- **Cleanup en `finally`** — siempre cerrar el dialog con `setConfirmDeleteId(null)` aunque falle el fetch, para no dejar el modal abierto con un error que no se ve.
- **Para bulk**: usar un boolean `confirmBulkOpen`, el handler lee de `selectedIds` directamente.
- **Para descripciones dinámicas** (ej: "Se van a eliminar 5 elementos"), interpolá en el `description` con el contador del state (`selectedIds.size`).
- **Reemplazos canónicos hechos** en: vehicle-table, customers-table, sales-table, quotations-table, quotation-detail-client, users-tab (cancelar invite), reviews-settings, sale-documents, vehicle-image-uploader, gallery-grid, media-uploader, ml-integration-card. **Mirar cualquiera de esos** como referencia si tenés dudas.

### 6. Base UI Select: labels vía render fn

El wrapper de `Select` usa `@base-ui/react`, que **no replica el children del `SelectItem` en el `SelectValue` automáticamente** (a diferencia de Radix). Si seteás `value="all"`, el trigger muestra `"all"` literal. Solución: pasar render fn al `SelectValue`:

```tsx
<SelectValue placeholder="Todos los estados">
  {(v) => STATUS_LABEL_BY_VALUE[v as string] ?? "Todos los estados"}
</SelectValue>
```

Mantené un `LABEL_BY_VALUE: Record<string, string>` como fuente única (derivado de las options con `Object.fromEntries`).

### 7. SelectTrigger dentro de un form: `w-full` explícito

El `SelectTrigger` default tiene `w-fit` (queda al ancho del contenido — bueno para filtros inline). Dentro de un form, donde cada Select ocupa una columna del grid, **agregar `className="w-full"`** para que coincida con los Inputs del mismo grid:

```tsx
<SelectTrigger id="province" className="w-full">
```

### 8. Tabla densa: patente en font-mono, no columna nueva

Para mostrar la patente del vehículo en una tabla (leads, ventas, cotizaciones), **NO agregar columna nueva** — meterla en el subtítulo del vehículo con `font-mono uppercase tracking-wider` para que se lea como identificador (mismo patrón que vehicle-table):

```tsx
<p className="text-xs text-muted-foreground">
  {vehicle.brand} {vehicle.model} · {vehicle.year}
  {vehicle.licensePlate && (
    <>
      {" · "}
      <span className="font-mono uppercase tracking-wider text-foreground/80">
        {vehicle.licensePlate}
      </span>
    </>
  )}
</p>
```

### 9. Counts en chips/tabs: Badge en vez de paréntesis

```tsx
// ❌ "Todos (3)"
<TabsTrigger>Todos ({count})</TabsTrigger>

// ✅ "Todos [3]" como Badge inline
<TabsTrigger>
  Todos
  <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
    {count}
  </Badge>
</TabsTrigger>
```

Usar `variant="destructive"` solo si el count es una alerta (ej: "No leídos"); para el resto, `secondary`.

### 10. Forms centrados con `mx-auto max-w-3xl`

Las pages que renderizan un form deben envolver al componente en un wrapper centrado:

```tsx
<div className="mx-auto max-w-3xl space-y-6">
  <h1>Editar cliente</h1>
  <CustomerForm customer={customer} />
</div>
```

Sin `mx-auto`, el form queda pegado a la izquierda. `max-w-3xl` (~768px) da un ancho cómodo de lectura.

### 11. Atajos de contacto (WhatsApp / mailto / tel)

En vistas de detalle/sheet con datos de contacto, agregar atajos clickeables (no solo texto). El teléfono en formato `tel:` para llamar + botón verde de WhatsApp con `wa.me/{numero}` (normalizando código país AR si falta). Ver [src/components/dashboard/lead-detail-sheet.tsx](src/components/dashboard/lead-detail-sheet.tsx) como referencia.

### 12. PDF (pdfmake): un solo doc, sin React

Los PDFs server-side usan `pdfmake` (no react-pdf — fue probado y rompió por incompatibilidad de React canary de Next 15 con react-pdf v4). Ver [src/lib/pdf/](src/lib/pdf/) — el componente es un `TDocumentDefinitions` plano (objetos JS), no JSX. Imágenes como data URI base64 (PNG/JPEG; WebP no soportado por pdfkit). Externalizado en `next.config.ts` (`serverExternalPackages: ["pdfmake", "pdfkit"]`) para que mantenga acceso a sus archivos `.afm` en runtime.

## Modelos de Datos (Prisma)

Ver schema completo en [prisma/schema.prisma](prisma/schema.prisma). Resumen:

- **`Dealership`** — concesionario (tenant). Identificado por `slug` único. Branding (`logo`, `theme: Json`), contacto, `website` (dominio custom). Tabla: `dealerships`.
- **`DealershipUser`** — junction Clerk user ↔ Dealership con `role` (`admin | editor | viewer`). Único por `(clerkUserId, dealershipId)`. Tabla: `dealership_users`.
- **`Vehicle`** — vehículo del catálogo. `price: Decimal(12, 2)`, `currency: ARS | USD`, `condition: new | used`, `status: available | reserved | sold`, `bodyType: suv | sedan | hatchback | coupe | pickup | minivan | convertible`. Identificadores legales opcionales: `vin`, `motorNumber`, `licensePlate`. Flags `featured` y `publishedAt`. Si tiene venta activa (`reserved | in_progress | completed`), el handler bloquea ediciones — ver [src/lib/sale-guards.ts](src/lib/sale-guards.ts). Tabla: `vehicles`.
- **`VehicleImage`** — imágenes ordenadas con `order` y flag `isPrimary`. Cascade desde Vehicle. Tabla: `vehicle_images`.
- **`Lead`** — consulta entrante (pre-venta). Vehículo opcional (`onDelete: SetNull`). `source: web | whatsapp | mercadolibre`, `status: new | contacted | qualified | closed`. Tabla: `leads`.
- **`Customer`** — cliente del concesionario (entidad distinta de Lead). `type: individual | company`, `documentType: DNI | CUIT | CUIL | PASAPORTE`. Único por `(dealershipId, documentType, documentNumber)`. Tabla: `customers`.
- **`Sale`** — operación de venta. `status: draft | reserved | in_progress | completed | cancelled` con transiciones controladas (`draft → reserved → in_progress → completed`, cualquiera → `cancelled`). Una venta activa por vehículo (partial unique en SQL — ver sección Prisma). Maneja `salePrice`, `depositAmount`, `invoiceNumber`, fechas (`depositDate`, `invoiceDate`, `deliveryDate`) y `cancelReason`. El status del vehículo asociado se sincroniza automáticamente en transacciones. Tabla: `sales`.
- **`SaleDocument`** — documento del legajo de venta. Categorizado en `customer | vehicle | operation` con `type` específico (DNI, F08, Boleto, FACTURA_AFIP, etc.). `dealershipId` denormalizado para queries rápidas por tenant. **Datos personales sensibles** — viven en bucket privado y se sirven solo vía presigned URL. Tabla: `sale_documents`.
- **`Review`** — opinión pública del cliente sobre el concesionario. Entra como `pending` desde el form del sitio del tenant; el admin la modera en el dashboard (`pending | approved | rejected`). `rating: 1-5`. Tabla: `reviews`.
- **`FinancingPlan`** — banner/video de planes de financiación administrable desde el dashboard (`assetType: image | video | youtube`). Se renderizan en el sitio del tenant. Tabla: `financing_plans`.
- **`WaitlistEntry`** — entradas de la landing pre-launch. `email` único. Tabla: `waitlist_entries`.

**Distinción clave Lead vs Customer:** un `Lead` es una consulta pre-venta (puede no tener email, puede ser anónimo). Un `Customer` es alguien que firma una operación — tiene documento obligatorio. No mezclar.

Todas las constantes de los string-enums viven en [src/lib/constants.ts](src/lib/constants.ts) como `as const` arrays con tipos derivados.

## Redis (Upstash) — estado actual

**Implementado:**
- **Rate limiting** en `/api/public/*` y `/api/waitlist` con `@upstash/ratelimit` (sliding window). Ver convención en sección "Rate limiting + honeypot" más arriba.

**Pendiente (cache-aside del catálogo público):**

Los lugares previstos para sumar cache:
- **Catálogo público** de vehículos por concesionario — invalidar al crear/editar/eliminar/publicar vehículo o reordenar imágenes.
- **Datos del concesionario** (config, branding) — TTL de 5 minutos, invalidar al PUT de `/api/concesionario` o PATCH de `/api/concesionario/theme`.

Pattern previsto: cache-aside con invalidación manual desde los handlers de mutación.

```ts
const cacheKey = `dealership:${slug}:vehicles`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const vehicles = await prisma.vehicle.findMany({ where: { dealershipId } });
await redis.set(cacheKey, JSON.stringify(vehicles), { ex: 300 });
return vehicles;
```

## Variables de Entorno

```env
# Database (Neon — Postgres serverless)
DATABASE_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Upstash Redis (REST API)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Storage
STORAGE_DRIVER=local                # "local" para dev, "s3" para prod (Vercel NO soporta local)

# Storage S3-compatible (Cloudflare R2 esperado) — solo si STORAGE_DRIVER=s3
# Dos buckets separados: público (imágenes catálogo) + privado (documentos legajo).
S3_ENDPOINT=                        # ej: https://<account>.r2.cloudflarestorage.com
S3_REGION=auto                      # R2 usa "auto"; otros providers según corresponda
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_PUBLIC_BUCKET=                   # bucket público — imágenes del catálogo
S3_PUBLIC_URL=                      # custom domain o https://pub-xxx.r2.dev (sin trailing slash)
S3_PRIVATE_BUCKET=                  # bucket privado — documentos del legajo (presigned URLs)

# Email (Resend)
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_DOMAIN=motorflowapp.com

# Feature flags
NEXT_PUBLIC_ENABLE_LOGIN=false      # "true" habilita dashboard + protección de rutas
```

## Estado actual del MVP

**Hecho:**
- Landing pública con waitlist (`/`) + `POST /api/waitlist`.
- Auth con Clerk (sign-in en `/sign-in`).
- Onboarding: usuario sin Dealership cae en `(onboarding)/onboarding` y crea su concesionario.
- Dashboard layout con sidebar + header.
- Vehículos: CRUD + `publish`, `featured`, `status` + gestión de imágenes (upload, delete, reorder) con storage abstraction.
- Leads: list + detail sheet + update de estado + delete.
- Clientes: CRUD completo.
- Ventas: CRUD + transición de estado controlada + legajo de documentos con presigned URLs.
- Reviews: form público en sitio del tenant + moderación en dashboard.
- Configuración: contacto y theme del dealership; sección `sitio-web` para personalización.
- Sitio público del concesionario (`/tenant/[slug]/...`) con catálogo, detalle, contact-form, review-form.
- Endpoints públicos: `/api/public/tenant/[slug]/{vehicles,leads,reviews}` + `/api/waitlist`.
- Middleware de subdomain routing (rewrite a `/tenant/{slug}` en producción).
- Storage S3-compatible (Contabo) con dos buckets — público (imágenes) + privado (documentos legajo, presigned 5min TTL).
- Convención de logging con `withLogger` + request_id propagado.
- **Seguridad**: headers (X-Frame, nosniff, Referrer-Policy, Permissions-Policy, HSTS-prod), rate limiting Upstash en públicos, honeypot anti-bots en forms públicos.
- Auditoría manual de `dealershipId` en todos los handlers autenticados (sin agujeros encontrados).

**Pendiente:**
- Cache Redis del catálogo público (cache-aside con invalidación).
- CSP (Content-Security-Policy) — iteración aparte con Clerk-tuning en modo report-only primero.
- Webhooks de Clerk para sync de usuarios.
- Email transaccional con Resend.
- Testing (Vitest + RTL).

## Reglas para Claude

1. **Nunca generar código sin tipos.** Todo debe estar tipado.
2. **Preferir Server Components.** Solo usar `"use client"` si hay interactividad.
3. **No instalar librerías sin preguntar.** Salvo las que ya están en el stack.
4. **Validar todo input con Zod.** Tanto en API routes como en forms.
5. **Usar `withLogger`** para todo route handler nuevo. No mezclar handlers crudos con handlers logueados.
6. **Filtrar por `dealershipId`** en TODA query a DB de endpoints autenticados. Multi-tenancy es no-negociable.
7. **Importar storage desde `@/lib/storage`**, nunca el driver directo.
8. **No hardcodear strings de UI.** Usar constantes o un approach que permita i18n futuro.
9. **Manejar errores siempre.** El `withLogger` cubre el catch global; igual envolver en try/catch cuando hay cleanup.
10. **No crear archivos de más de 200 líneas.** Si un archivo crece, refactorizar.
11. **Cada componente en su propio archivo.**
12. **Commits atómicos.** Un commit = un cambio lógico.
13. **Preguntar antes de decisiones arquitectónicas grandes.**
14. **Manejo de estado Loading en Forms:** Cuando un form hace un redirect (`router.push()`) al terminar con éxito, **NO** hagas `setLoading(false)` en un bloque `finally`. El `router.push` es asíncrono y el `finally` se ejecuta antes, habilitando el botón mientras se cambia de página (riesgo de doble-click). Movelo a los bloques de error o usá el hook `useFormStatus` / `isPending` (useTransition) de React.
15. **Labels Opcionales:** No incluyas el texto "(opcional)" en los labels de los campos que no son requeridos. La convención visual es indicar con un asterisco `*` los que SÍ son obligatorios; por descarte, se asume que los demás son opcionales. Evitar el ruido visual innecesario en la UI.
16. **Rate limit + honeypot en endpoints públicos:** todo handler nuevo bajo `/api/public/*` o `/api/waitlist` debe aplicar `applyRateLimit(...)` y `isHoneypotTriggered(...)` ANTES de tocar DB. El honeypot devuelve 201 fake (no 4xx — para no enseñarle al bot). Headers `X-RateLimit-*` se incluyen en TODAS las responses (éxito y error).
17. **AWS SDK v3 + S3-compatible providers:** el cliente S3 en [src/lib/storage/s3.ts](src/lib/storage/s3.ts) usa `requestChecksumCalculation: "WHEN_REQUIRED"` y `responseChecksumValidation: "WHEN_REQUIRED"`. **No sacar estas flags.** Sin ellas, el SDK manda un header `x-amz-sdk-checksum-algorithm` que Contabo/Backblaze B2/MinIO no entienden, responden con error en JSON (no XML), y el deserializer del SDK explota con `char '{' is not expected`.
