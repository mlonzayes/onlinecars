# /project:review — Revisión de código

Revisá el código del archivo o directorio indicado. Enfocate en:

1. **Type safety:** ¿Hay `any`, tipos faltantes o casteos innecesarios?
2. **Validación:** ¿Los inputs están validados con Zod?
3. **Auth:** ¿Los endpoints protegidos verifican auth con Clerk?
4. **Multi-tenancy:** ¿Las queries filtran por `dealershipId`? Nunca debe haber data leaks entre tenants.
5. **Error handling:** ¿Se manejan los errores correctamente?
6. **Performance:** ¿Hay N+1 queries, fetches innecesarios o falta de caché?
7. **Convenciones:** ¿Sigue las convenciones de naming y estructura del CLAUDE.md?

Reportá los problemas encontrados con severidad: 🔴 Crítico, 🟡 Importante, 🔵 Menor.