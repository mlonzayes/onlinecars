# Estilo de Código

## TypeScript

- Strict mode siempre habilitado.
- No usar `any`. Usar `unknown` + type narrowing si es necesario.
- No usar `enum`. Usar `as const` satisfies:

```ts
// ✅ Correcto
const FUEL_TYPES = ["nafta", "diesel", "gnc", "electrico", "hibrido"] as const;
type FuelType = (typeof FUEL_TYPES)[number];

// ❌ Incorrecto
enum FuelType { NAFTA, DIESEL, GNC }
```

- Preferir `interface` sobre `type` para objetos. Usar `type` para uniones y utilidades.
- Exportar tipos desde el mismo archivo si son específicos, desde `types/` si se reusan.

## React / Next.js

- Server Components por defecto. `"use client"` solo cuando hay interactividad.
- No usar `useEffect` para fetch de datos. Usar Server Components o Server Actions.
- Props destructuradas en la firma de la función.
- Componentes de menos de 200 líneas. Si crece, extraer subcomponentes.
- Un componente por archivo.

## Imports

Orden de imports (automático con eslint):
1. React / Next.js
2. Librerías externas
3. Alias internos (`@/lib`, `@/components`, etc.)
4. Tipos
5. Estilos

## Archivos

- Máximo 200 líneas por archivo.
- Nombres en kebab-case: `vehicle-card.tsx`, `use-vehicles.ts`.
- Carpeta `__tests__/` al mismo nivel si hay tests.