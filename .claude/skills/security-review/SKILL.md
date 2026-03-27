# Security Review Skill

## Trigger

Se invoca automáticamente cuando se crean o modifican:
- API Routes (`app/api/**/*.ts`)
- Middleware (`middleware.ts`)
- Funciones en `lib/auth.ts`
- Schema de Prisma (`prisma/schema.prisma`)

## Checklist automático

### Autenticación
- [ ] ¿El endpoint verifica `auth()` de Clerk?
- [ ] ¿Se valida que el usuario pertenece al dealership correcto?

### Multi-tenancy
- [ ] ¿Todas las queries filtran por `dealershipId`?
- [ ] ¿No hay forma de acceder a datos de otro tenant manipulando params?

### Validación
- [ ] ¿El input está validado con Zod?
- [ ] ¿Se sanitizan strings para prevenir XSS?
- [ ] ¿Los IDs de URL se validan como CUID válidos?

### Rate Limiting
- [ ] ¿Los endpoints públicos tienen rate limiting?
- [ ] ¿El rate limit se aplica por IP y por slug de concesionario?

### Datos sensibles
- [ ] ¿No se exponen datos internos (IDs de Clerk, emails de otros tenants)?
- [ ] ¿Los error messages no revelan info de la DB?