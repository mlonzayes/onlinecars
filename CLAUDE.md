# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# OnlineCars — Plataforma SaaS para Concesionarios de Autos

## Descripción General

**OnlineCars** es una plataforma SaaS multi-tenant que permite a concesionarios de autos tener su propio sitio web profesional con catálogo de vehículos, gestión de stock, captación de leads y operatoria de venta (clientes, ventas, legajo de documentos). Cada concesionario obtiene un sitio personalizado con su branding, dominio propio, y un panel de administración.

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
| Cache / rate-limit | Upstash Redis (REST API, `@upstash/redis`) — disponible, no usado todavía |
| Estilos | Tailwind CSS v4 + shadcn/ui (Base UI por debajo) |
| Deploy | Vercel |
| Storage (imágenes) | Abstracción driver-based en `lib/storage/` (`local` por default, `s3` para prod). S3 vía AWS SDK v3 (`@aws-sdk/client-s3` + presigner). Destino esperado: Cloudflare R2. |
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

El modelo de multi-tenancy se resuelve por **subdomain routing** (default domain `onlinecars.com.ar`, configurable vía `NEXT_PUBLIC_APP_DOMAIN`):

```
{slug}.onlinecars.com.ar  → Sitio público del concesionario (rewrite a /tenant/{slug})
app.onlinecars.com.ar     → Panel de administración (dashboard)
onlinecars.com.ar         → Landing pública (waitlist) + onboarding + sign-in
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
│       │       ├── publish/         # POST publicar
│       │       ├── featured/        # POST toggle featured
│       │       ├── status/          # PUT cambiar status
│       │       └── images/          # POST + [imageId] (DELETE) + /order (PUT reordenar)
│       ├── leads/                   # GET + [id] (GET/PUT)
│       ├── clientes/                # GET, POST + [id] (GET/PUT/DELETE)
│       ├── ventas/                  # GET, POST + [id] (GET/PUT) + [id]/status
│       └── public/                  # Endpoints SIN auth para sitio público
│           └── tenant/[slug]/
│               ├── vehicles/        # GET catálogo
│               └── leads/           # POST consulta
├── components/
│   ├── ui/                          # shadcn/ui
│   ├── dashboard/                   # sidebar, header, *-form, *-table, *-detail-sheet, settings/*, vehicle-image-uploader
│   ├── tenant/                      # Componentes del sitio público
│   └── shared/                      # navbar, waitlist-form
├── lib/
│   ├── prisma.ts                    # Singleton con PrismaNeon adapter
│   ├── redis.ts                     # Upstash Redis REST client
│   ├── auth.ts                      # getCurrentDealership() — resuelve Dealership del user logueado
│   ├── tenant.ts                    # Queries para sitio público (getDealershipBySlug, getPublishedVehicles, ...)
│   ├── api-handler.ts               # withLogger() — wrapper para route handlers (ver sección API)
│   ├── logger.ts                    # JSON structured logger + generateRequestId()
│   ├── storage/                     # Abstracción de storage (local | s3) según STORAGE_DRIVER
│   ├── utils.ts                     # cn() y helpers
│   ├── validators/                  # Schemas Zod (vehicle, vehicle-image, lead, customer, sale, dealership, waitlist)
│   └── constants.ts                 # `as const` lists (FUEL_TYPES, STATUSES, PROVINCIAS_ARGENTINA, etc.)
├── types/index.ts                   # ApiResponse, ApiListResponse, ApiError, DealershipTheme
├── middleware.ts                    # Subdomain routing + Clerk auth (con flag de login)
└── prisma/
    ├── schema.prisma
    └── migrations/
```

**Pendientes conocidos** (no existen aún en `src/`):
- Webhooks de Clerk en `/api/webhooks/clerk/` para sync de usuarios.
- Cache Redis del catálogo público + invalidación.
- Rate limiting Redis en `/api/public/*`.
- Email transaccional con Resend (deps instaladas, sin uso).
- `hooks/` — todavía no se creó la carpeta.

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

### Storage de imágenes

La abstracción vive en [src/lib/storage/](src/lib/storage/). El driver activo se decide por env:

- `STORAGE_DRIVER=local` (default) → guarda en filesystem local. **No funciona en Vercel** (filesystem read-only en runtime). Sirve solo para dev.
- `STORAGE_DRIVER=s3` → S3-compatible (Cloudflare R2 esperado). Antes de deploy a prod hay que setearlo.

Nunca importar `s3.ts` o `local.ts` directo desde un handler — usar `import { storage } from "@/lib/storage"` para que el driver sea transparente.

### Prisma

- Un solo archivo `schema.prisma`.
- **Convención adoptada:** TODOS los modelos usan `@@map` para mapear a `snake_case` en la DB (ej: `model Dealership { @@map("dealerships") }`). Las columnas se mantienen en `camelCase` en el cliente Prisma.
- Client singleton en [src/lib/prisma.ts](src/lib/prisma.ts) usando `PrismaNeon(neon(DATABASE_URL))` — **siempre usar este import**, no instanciar `PrismaClient` directo.
- Migraciones con nombres descriptivos: `pnpm exec prisma migrate dev --name add_vehicle_images`.
- `onDelete` adoptados en el schema:
  - Relaciones a `Dealership` → `Cascade` (borrar el tenant borra todo lo suyo).
  - `Lead.vehicle` → `SetNull` (preservar el lead si se borra el vehículo).
  - `Sale.vehicle` y `Sale.customer` → `Restrict` (no se puede borrar un vehículo o cliente con venta asociada).
  - `SaleDocument.sale` → `Cascade`.
- `Sale.vehicleId` es `@unique`: un vehículo se vende una sola vez. Si se cancela queda `status: cancelled` con `cancelReason` y libera al vehículo.
- `Customer` tiene `@@unique([dealershipId, documentType, documentNumber])`.

### Git

- **Commits en inglés** con conventional commits:
  - `feat: add vehicle catalog page`
  - `fix: resolve image upload on mobile`
  - `chore: update prisma schema`
  - `refactor: extract vehicle service layer`
- **Branches:** `feature/{nombre}`, `fix/{nombre}`, `chore/{nombre}`
- **PR titles** siguen la misma convención.

## Modelos de Datos (Prisma)

Ver schema completo en [prisma/schema.prisma](prisma/schema.prisma). Resumen:

- **`Dealership`** — concesionario (tenant). Identificado por `slug` único. Branding (`logo`, `theme: Json`), contacto, `website` (dominio custom). Tabla: `dealerships`.
- **`DealershipUser`** — junction Clerk user ↔ Dealership con `role` (`admin | editor | viewer`). Único por `(clerkUserId, dealershipId)`. Tabla: `dealership_users`.
- **`Vehicle`** — vehículo del catálogo. `price: Decimal(12, 2)`, `currency: ARS | USD`, `condition: new | used`, `status: available | reserved | sold`. Identificadores legales opcionales: `vin`, `motorNumber`, `licensePlate`. Flags `featured` y `publishedAt`. Tabla: `vehicles`.
- **`VehicleImage`** — imágenes ordenadas con `order` y flag `isPrimary`. Cascade desde Vehicle. Tabla: `vehicle_images`.
- **`Lead`** — consulta entrante (pre-venta). Vehículo opcional (`onDelete: SetNull`). `source: web | whatsapp | mercadolibre`, `status: new | contacted | qualified | closed`. Tabla: `leads`.
- **`Customer`** — cliente del concesionario (entidad distinta de Lead). `type: individual | company`, `documentType: DNI | CUIT | CUIL | PASAPORTE`. Único por `(dealershipId, documentType, documentNumber)`. Tabla: `customers`.
- **`Sale`** — operación de venta. `vehicleId` es `@unique`. `status: draft | reserved | in_progress | completed | cancelled`. Maneja `salePrice`, `depositAmount`, `invoiceNumber`, fechas (`depositDate`, `invoiceDate`, `deliveryDate`) y `cancelReason`. Tabla: `sales`.
- **`SaleDocument`** — documento del legajo de venta. Categorizado en `customer | vehicle | operation` con `type` específico (DNI, F08, Boleto, FACTURA_AFIP, etc.). `dealershipId` denormalizado para queries rápidas por tenant. Tabla: `sale_documents`.
- **`WaitlistEntry`** — entradas de la landing pre-launch. `email` único. Tabla: `waitlist_entries`.

**Distinción clave Lead vs Customer:** un `Lead` es una consulta pre-venta (puede no tener email, puede ser anónimo). Un `Customer` es alguien que firma una operación — tiene documento obligatorio. No mezclar.

Todas las constantes de los string-enums viven en [src/lib/constants.ts](src/lib/constants.ts) como `as const` arrays con tipos derivados.

## Caché con Redis (aspiracional — no implementado todavía)

El cliente Redis ya está en `lib/redis.ts` pero NO hay caché ni rate limiting wired up. Cuando se implemente, los lugares previstos son:

- **Catálogo público** de vehículos por concesionario (invalidar al crear/editar/eliminar vehículo o imagen).
- **Datos del concesionario** (config, branding) — TTL de 5 minutos.
- **Rate limiting** en endpoints `/api/public/*` (leads, contacto).

Pattern previsto: cache-aside con invalidación manual.

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
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

# Email (Resend)
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_DOMAIN=onlinecars.com.ar

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
- Leads: list + detail sheet + update de estado.
- Clientes: CRUD completo.
- Ventas: CRUD + transición de estado + legajo de documentos.
- Configuración: contacto y theme del dealership; sección `sitio-web` para personalización.
- Sitio público del concesionario (`/tenant/[slug]/...`) con catálogo y detalle.
- Endpoints públicos `/api/public/tenant/[slug]/vehicles` y `/leads`.
- Middleware de subdomain routing (rewrite a `/tenant/{slug}` en producción).
- Convención de logging con `withLogger` + request_id propagado.

**Pendiente:**
- Webhooks de Clerk para sync de usuarios.
- Cache Redis del catálogo público (cache-aside con invalidación).
- Rate limiting Redis en `/api/public/*`.
- Email transaccional con Resend.
- Testing (Vitest + RTL).
- Implementación efectiva del driver `s3` en `lib/storage/s3.ts` si todavía es stub.

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
