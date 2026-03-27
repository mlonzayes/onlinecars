# Convenciones de API

## Estructura de Endpoints

```
/api/vehiculos          → GET (list), POST (create)
/api/vehiculos/[id]     → GET (detail), PUT (update), DELETE
/api/leads              → GET (list), POST (create)
/api/concesionario      → GET (current), PUT (update)
/api/webhooks/clerk     → POST (Clerk webhook handler)
```

## Autenticación

Todos los endpoints bajo `/api/` (excepto webhooks y endpoints públicos) requieren auth:

```ts
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  // ...
}
```

## Multi-tenancy

**CRÍTICO:** Toda query a la base de datos DEBE filtrar por `dealershipId` del usuario autenticado. Nunca exponer datos de otro tenant.

```ts
// ✅ Siempre filtrar por tenant
const vehicles = await prisma.vehicle.findMany({
  where: { dealershipId: currentDealershipId },
});

// ❌ NUNCA hacer esto
const vehicles = await prisma.vehicle.findMany();
```

Crear un helper `getCurrentDealership(userId)` en `lib/auth.ts` que resuelva el dealership del usuario logueado.

## Validación

Todo input DEBE validarse con Zod antes de llegar a la DB:

```ts
import { vehicleCreateSchema } from "@/lib/validators/vehicle";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = vehicleCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // usar parsed.data (tipado y validado)
}
```

## Respuestas

Formato consistente:

```ts
// Éxito
{ data: T }
{ data: T[], meta: { total: number, page: number, limit: number } }

// Error
{ error: string, details?: unknown }
```

## Endpoints Públicos (sin auth)

Estos endpoints son accesibles desde el sitio público del concesionario:

- `GET /api/public/[slug]/vehiculos` — Catálogo público
- `GET /api/public/[slug]/vehiculos/[id]` — Detalle público
- `POST /api/public/[slug]/leads` — Crear consulta
- `GET /api/public/[slug]/info` — Info del concesionario

Aplicar rate limiting con Redis en estos endpoints.