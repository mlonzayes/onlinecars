# AGENTS.md — motorflow

Lean startup guide for OpenCode sessions. Read `CLAUDE.md` for the full reference; this file captures only what an agent is likely to get wrong.

## Commands

- **Package manager:** `pnpm` (not npm/yarn)
- **Dev server:** `pnpm dev` → `http://localhost:3000`
- **Build:** `pnpm build` → `next build`
- **Typecheck:** `pnpm exec tsc --noEmit` (no `typecheck` script in package.json)
- **No lint or test scripts exist.** Do not install Vitest/Playwright without asking.
- **Prisma:**
  - Generate client: `pnpm exec prisma generate`
  - New migration: `pnpm exec prisma migrate dev --name <name>`
  - Apply in prod: `pnpm exec prisma migrate deploy`
  - Studio: `pnpm exec prisma studio`
- **Single-file Prisma config:** `prisma.config.ts` (not in `prisma/`)

## Architecture gotchas

- **Multi-tenancy is subdomain-based only in production.** On `localhost`, everything runs on `:3000` — access dashboard at `/dashboard`, tenant sites at `/tenant/{slug}`.
- **`NEXT_PUBLIC_ENABLE_LOGIN=false` gates the entire dashboard.** If the flag is off, middleware doesn't protect routes and dashboard layout redirects to `/`. Auth flows must respect this gate.
- **All authenticated DB queries MUST filter by `dealershipId`.** No exceptions. Tenant isolation is the most critical security rule in this project.
- **There is no monorepo.** `pnpm-workspace.yaml` only lists ignored built dependencies.

## Coding conventions (non-obvious)

| Rule | Detail |
|------|--------|
| API URL language | Dashboard in **Spanish** (`/api/vehiculos`, `/api/ventas`); public endpoints in **English** (`/api/public/.../vehicles`) |
| Code vs UI language | Code: English. UI labels/text: Spanish. Comments: Spanish (only when not obvious). |
| `withLogger` | ALL route handlers must use `withLogger` from `@/lib/api-handler`. Never raw handlers. |
| Public endpoint security | Rate limit FIRST (`applyRateLimit`), then honeypot check (`isHoneypotTriggered`), then Zod validation. Honeypot returns 201 fake — never 4xx. Rate limit headers go on ALL responses. |
| Storage driver | Import from `@/lib/storage` — never import `local.ts` or `s3.ts` directly. |
| S3 AWS SDK | `requestChecksumCalculation: "WHEN_REQUIRED"` and `responseChecksumValidation: "WHEN_REQUIRED"` MUST stay in `src/lib/storage/s3.ts`. Without them, S3-compatible providers (Contabo, B2, MinIO) return JSON error and crash. |
| No `enum` | Use `as const` + derived type (e.g. `const FUEL_TYPES = [...] as const; type FuelType = typeof FUEL_TYPES[number]`) |
| Labels | No "(opcional)" suffix. Required fields marked with `*`; everything else is optional by convention. |
| Loading + redirect | When a form calls `router.push()` on success, do NOT `setLoading(false)` in `finally` — move it to error blocks only. `finally` runs before the async redirect completes, enabling double-clicks. |
| `Sale.vehicleId` uniqueness | Not a Prisma `@unique`. Enforced via SQL partial unique index (`UNIQUE WHERE status != 'cancelled'`) in an existing migration. |

## Key files to reference

- `CLAUDE.md` — full architecture, data models, env vars, additional conventions
- `src/middleware.ts` — subdomain routing + Clerk auth with login flag
- `src/lib/api-handler.ts` — `withLogger` wrapper signature
- `src/lib/rate-limit.ts` — 4 preconfigured limiters + `getClientIp()` + `applyRateLimit()`
- `src/lib/honeypot.ts` — `HONEYPOT_FIELD = "website"`, `isHoneypotTriggered()`
- `src/lib/auth.ts` — `getCurrentDealership()`
- `src/lib/constants.ts` — all `as const` type definitions (fuel types, statuses, provinces, etc.)
- `src/lib/validators/` — Zod schemas for every entity
- `prisma/schema.prisma` — data model with `@@map` conventions and `onDelete` rules
- `.claude/rules/` — API conventions, code styles, testing rules (Claude-specific)
- `src/app/api/public/tenant/[slug]/leads/route.ts` — canonical example of a public endpoint with rate limit + honeypot + Zod

## Path alias

`@/` → `./src/` (configured in `tsconfig.json`).

## Multi-tenant data model

- `Dealership` = tenant. All models relate to it (Cascade on delete).
- `DealershipUser` = junction (Clerk user ↔ Dealership). Unique on `(clerkUserId, dealershipId)`.
- `Customer` unique on `(dealershipId, documentType, documentNumber)`.
- `Lead` ≠ `Customer`. Lead = pre-sale inquiry (optional vehicle, can be anonymous). Customer = signed a deal (has mandatory document).
