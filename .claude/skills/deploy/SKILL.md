# Deploy Skill

## Trigger

Se invoca cuando el usuario menciona deploy, producción, o release.

## Workflow

### 1. Pre-flight checks

```bash
pnpm lint
pnpm build
npx prisma migrate status
```

### 2. Database

- Verificar que las migraciones están al día.
- Si hay migraciones pendientes: `npx prisma migrate deploy`
- Verificar que el schema está generado: `npx prisma generate`

### 3. Environment

Verificar que estas variables existen en el entorno de producción:
- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `REDIS_URL`
- `NEXT_PUBLIC_APP_URL`

### 4. Deploy

- Deploy a Vercel: `git push` al branch principal (auto-deploy).
- O manual: `vercel --prod`

### 5. Post-deploy

- Verificar health check: `curl https://app.{domain}/api/health`
- Verificar que el auth funciona
- Verificar un concesionario de prueba