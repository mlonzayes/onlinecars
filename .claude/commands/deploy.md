# /project:deploy — Checklist de deploy

Antes de deployar, verificá:

## Pre-deploy checks

- [ ] `pnpm build` compila sin errores
- [ ] `pnpm lint` pasa sin warnings
- [ ] No hay `console.log` en código de producción
- [ ] Las variables de entorno de producción están configuradas
- [ ] Las migraciones de Prisma están aplicadas: `npx prisma migrate deploy`
- [ ] El schema de Prisma está sincronizado: `npx prisma generate`
- [ ] No hay secrets hardcodeados en el código

## Post-deploy checks

- [ ] La app carga correctamente en producción
- [ ] El auth con Clerk funciona (sign in / sign up)
- [ ] El subdomain routing resuelve correctamente
- [ ] Las imágenes cargan desde el storage
- [ ] Los leads se crean correctamente