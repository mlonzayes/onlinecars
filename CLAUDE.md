# 🚗 ConceSaaS — Plataforma SaaS para Concesionarios de Autos

> **TODO:** Reemplazar "ConceSaaS" por el nombre definitivo del proyecto.

## Descripción General

Plataforma SaaS multi-tenant que permite a concesionarios de autos tener su propio sitio web profesional con catálogo de vehículos, gestión de stock y captación de leads. Cada concesionario obtiene un sitio personalizado con su branding, dominio propio, y un panel de administración para gestionar su inventario y consultas.

**Target:** Concesionarios medianos y chicos de Argentina que hoy dependen de MercadoLibre/portales y no tienen presencia web propia.

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript (strict mode) |
| Auth | Clerk |
| Base de datos | Neon (PostgreSQL serverless) |
| ORM | Prisma |
| Cache | Redis (Upstash o self-hosted) |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Deploy | Vercel |
| Storage (imágenes) | Cloudflare R2 / Uploadthing / Supabase Storage (TBD) |
| Email transaccional | Resend |
| Validación | Zod |
| State management | Zustand (solo si es necesario) |

## Arquitectura

### Multi-tenancy

El modelo de multi-tenancy se resuelve por **subdomain routing**:

```
{slug}.concesite.com  → Sitio público del concesionario
app.concesite.com     → Panel de administración (dashboard)
concesite.com         → Landing page / marketing
```

Cada concesionario tiene un `slug` único. El middleware de Next.js detecta el subdominio y resuelve el tenant.

### Estructura de la App (App Router)

```
src/
├── app/
│   ├── (marketing)/          # Landing page pública
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/          # Panel admin (protegido con Clerk)
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Dashboard home
│   │   ├── vehiculos/        # CRUD de vehículos
│   │   ├── leads/            # Gestión de consultas
│   │   ├── configuracion/    # Settings del concesionario
│   │   └── perfil/           # Perfil del usuario
│   ├── (tenant)/             # Sitio público del concesionario
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Home del concesionario
│   │   ├── catalogo/         # Listado de vehículos
│   │   └── vehiculo/[id]/    # Detalle del vehículo
│   └── api/                  # API Routes
│       ├── vehiculos/
│       ├── leads/
│       ├── concesionarios/
│       └── webhooks/
│           └── clerk/
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── dashboard/            # Componentes del panel
│   ├── tenant/               # Componentes del sitio público
│   └── shared/               # Componentes compartidos
├── lib/
│   ├── prisma.ts             # Prisma client singleton
│   ├── redis.ts              # Redis client
│   ├── auth.ts               # Helpers de Clerk
│   ├── utils.ts              # Utilidades generales
│   ├── validators/           # Schemas Zod
│   └── constants.ts          # Constantes de la app
├── hooks/                    # Custom React hooks
├── types/                    # TypeScript types/interfaces
├── middleware.ts              # Subdomain routing + auth
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

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
| API Routes | kebab-case en la URL | `/api/vehiculos/[id]` |
| Tablas Prisma | PascalCase singular | `model Vehicle {}` |
| Columnas Prisma | camelCase | `createdAt`, `fuelType` |
| Archivos de hooks | use-{nombre}.ts | `use-vehicles.ts` |

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

- Usar Route Handlers de Next.js (`route.ts`).
- Siempre validar input con Zod.
- Siempre verificar auth con Clerk (`auth()` o `currentUser()`).
- Retornar respuestas consistentes:

```ts
// ✅ Respuesta exitosa
return NextResponse.json({ data: vehicle }, { status: 200 });

// ✅ Error
return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
```

### Prisma

- Un solo archivo `schema.prisma`.
- Usar `@map` y `@@map` para mapear a snake_case en la DB si se prefiere.
- Client singleton en `lib/prisma.ts` para evitar múltiples instancias en dev.
- Migraciones con nombres descriptivos: `npx prisma migrate dev --name add_vehicle_images`.

### Git

- **Commits en inglés** con conventional commits:
  - `feat: add vehicle catalog page`
  - `fix: resolve image upload on mobile`
  - `chore: update prisma schema`
  - `refactor: extract vehicle service layer`
- **Branches:** `feature/{nombre}`, `fix/{nombre}`, `chore/{nombre}`
- **PR titles** siguen la misma convención que los commits.

## Modelos de Datos (Prisma) — MVP

```prisma
model Dealership {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  logo        String?
  phone       String?
  email       String?
  whatsapp    String?
  address     String?
  city        String?
  province    String?
  website     String?  // Dominio personalizado
  theme       Json?    // Configuración de colores/branding
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  vehicles    Vehicle[]
  leads       Lead[]
  users       DealershipUser[]
}

model DealershipUser {
  id           String     @id @default(cuid())
  clerkUserId  String
  dealershipId String
  role         String     @default("admin") // admin | editor | viewer
  createdAt    DateTime   @default(now())

  dealership   Dealership @relation(fields: [dealershipId], references: [id])

  @@unique([clerkUserId, dealershipId])
}

model Vehicle {
  id            String   @id @default(cuid())
  dealershipId  String
  title         String   // Ej: "Toyota Corolla XEI 2.0 2023"
  brand         String
  model         String
  year          Int
  price         Decimal
  currency      String   @default("ARS") // ARS | USD
  kilometers    Int?
  fuelType      String?  // nafta | diesel | gnc | electrico | hibrido
  transmission  String?  // manual | automatica
  color         String?
  doors         Int?
  engine        String?  // Ej: "2.0L"
  description   String?
  condition     String   @default("used") // new | used
  status        String   @default("available") // available | reserved | sold
  featured      Boolean  @default(false)
  publishedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  dealership    Dealership @relation(fields: [dealershipId], references: [id])
  images        VehicleImage[]
  leads         Lead[]

  @@index([dealershipId, status])
  @@index([brand, model, year])
}

model VehicleImage {
  id         String  @id @default(cuid())
  vehicleId  String
  url        String
  alt        String?
  order      Int     @default(0)
  isPrimary  Boolean @default(false)

  vehicle    Vehicle @relation(fields: [vehicleId], references: [id], onDelete: Cascade)

  @@index([vehicleId])
}

model Lead {
  id           String   @id @default(cuid())
  dealershipId String
  vehicleId    String?
  name         String
  email        String?
  phone        String?
  message      String?
  source       String   @default("web") // web | whatsapp | mercadolibre
  status       String   @default("new") // new | contacted | qualified | closed
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  dealership   Dealership @relation(fields: [dealershipId], references: [id])
  vehicle      Vehicle?   @relation(fields: [vehicleId], references: [id])

  @@index([dealershipId, status])
}
```

## Caché con Redis

Usar Redis para:
- **Catálogo público** de vehículos por concesionario (invalidar al crear/editar/eliminar vehículo).
- **Datos del concesionario** (config, branding) — TTL de 5 minutos.
- **Rate limiting** en endpoints públicos (leads, contacto).

Pattern: Cache-aside con invalidación manual.

```ts
// Patrón básico
const cacheKey = `dealership:${slug}:vehicles`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const vehicles = await prisma.vehicle.findMany({ where: { dealershipId } });
await redis.set(cacheKey, JSON.stringify(vehicles), { ex: 300 });
return vehicles;
```

## Variables de Entorno

```env
# Database
DATABASE_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Redis
REDIS_URL=

# Storage (TBD)
STORAGE_BUCKET_URL=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_DOMAIN=
```

## Reglas para Claude

1. **Nunca generar código sin tipos.** Todo debe estar tipado.
2. **Preferir Server Components.** Solo usar `"use client"` si hay interactividad.
3. **No instalar librerías sin preguntar.** Salvo las que ya están en el stack.
4. **Validar todo input con Zod.** Tanto en API routes como en forms.
5. **No hardcodear strings de UI.** Usar constantes o un approach que permita i18n futuro.
6. **Manejar errores siempre.** Try/catch en API, error boundaries en componentes.
7. **No crear archivos de más de 200 líneas.** Si un archivo crece, refactorizar.
8. **Cada componente en su propio archivo.**
9. **Commits atómicos.** Un commit = un cambio lógico.
10. **Preguntar antes de decisiones arquitectónicas grandes.**