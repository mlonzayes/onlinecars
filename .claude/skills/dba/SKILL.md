---
name: dba
description: >
  Project-specific Postgres DBA assistant for OnlineCars (Next.js 15 + Prisma 7 + Neon).
  Analyzes prisma:query logs and source code to detect N+1 patterns, sequential awaits
  that should run in parallel, missing select projections, and missing indexes. Suggests
  concrete fixes referencing actual files in src/. Read-only: never touches the DB.
  Trigger: When the user mentions "queries lentas", "query lenta", "n+1", "explain analyze",
  "explain", "índice", "indices", "performance de DB", "performance de la base", or pastes
  raw lines starting with `prisma:query SELECT` from the dev console.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- The user pastes a dump of `prisma:query` lines from the dev server console.
- The user asks about slow queries, N+1, missing indexes, or DB performance.
- The user mentions `EXPLAIN ANALYZE` or wants to understand why a route is slow.
- A code review surfaces a `findMany` inside a loop, sequential `await`s, or a query that selects all columns when only a few are used.

**Do NOT use** to design new features, write migrations from scratch, or evaluate non-DB performance.

## Critical Patterns (must respect, no exceptions)

| Rule | Why |
|------|-----|
| **Never propose removing the `dealershipId` filter** from authenticated queries, even if it would speed things up. | Multi-tenant isolation is non-negotiable (CLAUDE.md rule 6). A leak between tenants is a far worse outcome than a slow query. |
| **Never propose raw SQL or direct DB writes** — index changes go through `prisma migrate dev`. | Schema is the source of truth; ad-hoc DB changes drift from migrations and break prod. |
| **Check the cache layer before suggesting query optimization** for the tenant home. | `getTenantHomeBundle()` in `src/lib/tenant.ts` already caches the home; if the slow query is from there, the real fix may be cache invalidation, not query tuning. |
| **Always cite the file and approximate line** where the fix applies. | Vague advice ("optimize this query") is useless; the user needs to know which handler to edit. |

## Schema Reference (current indexes)

Source of truth: `prisma/schema.prisma`.

| Model | Indexes | Notes |
|-------|---------|-------|
| `Dealership` | `slug` unique | tenant root |
| `DealershipUser` | `(clerkUserId, dealershipId)` unique | Clerk ↔ tenant junction |
| `Vehicle` | `(dealershipId, status)`, `(brand, model, year)` | most queries hit index 1 |
| `VehicleImage` | `(vehicleId)` | |
| `Lead` | `(dealershipId, status)` | |
| `Customer` | `(dealershipId, documentType, documentNumber)` unique, `(dealershipId)` | |
| `Sale` | `(dealershipId, status)`, `(customerId)` — **partial unique on `vehicleId WHERE status != 'cancelled'`** in migration `20260429004500_add_partial_unique_active_sale` | not declarative |
| `SaleDocument` | `(saleId)`, `(dealershipId)` | |
| `Review` | `(dealershipId, status)` | |
| `FinancingPlan` | `(dealershipId, active)` | |

If a `WHERE` or `ORDER BY` touches columns not in the table above, it's a candidate for a missing index.

## Patterns to Detect

### 1. N+1 (most common, highest impact)

**Signal in logs**: same `SELECT` template repeated N times with different `$1` values for the same parent.

```
prisma:query SELECT ... FROM vehicles WHERE id = $1
prisma:query SELECT ... FROM vehicle_images WHERE vehicleId = $1
prisma:query SELECT ... FROM vehicle_images WHERE vehicleId = $1   ← repeated for each vehicle
prisma:query SELECT ... FROM vehicle_images WHERE vehicleId = $1
...
```

**Fix**: pull the children in a single `findMany` with `include`:

```ts
// BAD
const vehicles = await prisma.vehicle.findMany({ where: { dealershipId } });
for (const v of vehicles) {
  v.images = await prisma.vehicleImage.findMany({ where: { vehicleId: v.id } });
}

// GOOD
const vehicles = await prisma.vehicle.findMany({
  where: { dealershipId },
  include: { images: true },
});
```

### 2. Sequential awaits that should be parallel

**Signal**: two or more independent queries one after another in the same handler, no shared dependency.

```ts
// BAD — runs in series
const total = await prisma.customer.count({ where });
const customers = await prisma.customer.findMany({ where, ... });

// GOOD — runs in parallel
const [total, customers] = await Promise.all([
  prisma.customer.count({ where }),
  prisma.customer.findMany({ where, ... }),
]);
```

The project already does this correctly in `src/app/dashboard/clientes/page.tsx` and `src/app/dashboard/vehiculos/page.tsx` — point to those as reference.

### 3. Missing `select` projection

**Signal in logs**: query selects 20+ columns but the caller only reads 2-3.

```ts
// BAD
const v = await prisma.vehicle.findFirst({ where: { id, dealershipId } });
return { id: v.id, title: v.title };

// GOOD
const v = await prisma.vehicle.findFirst({
  where: { id, dealershipId },
  select: { id: true, title: true },
});
```

### 4. Missing index

**Signal**: `WHERE` or `ORDER BY` on columns not in the schema reference table above.

**Fix**: add `@@index` to the relevant model in `prisma/schema.prisma`:

```prisma
model Vehicle {
  // ...
  @@index([dealershipId, publishedAt])  // example: if filtering by published+tenant
}
```

Then: `pnpm exec prisma migrate dev --name add_vehicle_published_index`.

### 5. `findFirst` where `findUnique` is more correct

**Signal**: `findFirst` with conditions that match a unique constraint exactly.

```ts
// BAD — uses findFirst even though slug is unique
const d = await prisma.dealership.findFirst({ where: { slug } });

// GOOD — explicit and slightly faster
const d = await prisma.dealership.findUnique({ where: { slug } });
```

Caveat: only valid when the `where` matches the unique key. If it adds extra filters (e.g. `slug AND active = true`), `findFirst` is correct.

### 6. Cache miss on the tenant home

**Signal**: queries to `dealerships`, `vehicles`, `reviews`, `vehicle_images` all firing on every visit to `/tenant/{slug}`.

Before suggesting query tuning, check if `getTenantHomeBundle()` is being called. If it is and the cache miss is frequent, the issue is likely a stale invalidation — point the user to `invalidateTenantHomeBundle()` callers in mutation handlers.

## Reasoning Workflow

When invoked with a log dump or a perf complaint:

1. **Count the queries**. How many in total? On which tables?
2. **Look for repetition**. Same SQL template firing N times = N+1 candidate.
3. **Cross-reference indexes**. Any `WHERE` / `ORDER BY` columns missing from the schema table above?
4. **Find the source file**. Match query patterns to handlers in `src/app/api/**/route.ts` or `src/lib/tenant.ts`.
5. **Check cache layer**. If the queries are tenant-home related, was the cache hit/miss?
6. **Output the table** (see Output Format) followed by code snippets and commands.

## Output Format

Always start with this table:

| Issue | Severity | Where | Fix sugerido |
|-------|----------|-------|--------------|
| N+1 on vehicle_images | high | `src/app/api/vehiculos/route.ts:~50` | Use `include: { images: true }` |
| Missing index on `publishedAt` | medium | `prisma/schema.prisma` Vehicle model | Add `@@index([dealershipId, publishedAt])` |
| ... | ... | ... | ... |

Severity guide:
- **high**: N+1 on a hot path, missing index on a frequent query, query that scans 1k+ rows.
- **medium**: missing `select` on a wide table, sequential when parallel is trivial, `findFirst` where `findUnique` is exact.
- **low**: stylistic / future-proofing.

After the table, include:
1. **Code snippets** with the actual fix, before/after.
2. **Commands** to run (e.g. `pnpm exec prisma migrate dev --name X`).

## Code Examples

### Example interaction

> **User**: "Tengo estas queries lentas:
> ```
> prisma:query SELECT ... FROM vehicles WHERE dealershipId = $1
> prisma:query SELECT ... FROM vehicle_images WHERE vehicleId = $1
> prisma:query SELECT ... FROM vehicle_images WHERE vehicleId = $1
> prisma:query SELECT ... FROM vehicle_images WHERE vehicleId = $1
> ```
> "

> **Skill response**:
>
> | Issue | Severity | Where | Fix sugerido |
> |-------|----------|-------|--------------|
> | N+1: vehicle_images consultado por vehículo | high | `src/lib/tenant.ts` `getPublishedVehicles()` o el caller | Usar `include: { images: true }` en el `findMany` |
>
> ```ts
> // src/lib/tenant.ts
> return prisma.vehicle.findMany({
>   where: { dealershipId, publishedAt: { not: null }, status: "available" },
>   include: { images: { orderBy: { order: "asc" } } },  // ← evita el N+1
>   orderBy: buildOrderBy(filters?.sort ?? "recent"),
> });
> ```
>
> Sin migración necesaria — solo cambio en la query.

## Commands

Common commands the skill suggests:

```bash
# Add a new index after editing schema.prisma
pnpm exec prisma migrate dev --name add_<table>_<columns>_index

# Regenerate the client after schema changes
pnpm exec prisma generate

# Inspect the live DB state (dev only)
pnpm exec prisma studio

# Check for pending migrations
pnpm exec prisma migrate status
```

The skill never runs these — only suggests them for the user to execute.
