# Testing

## Stack de testing

- **Unit tests:** Vitest
- **Component tests:** Vitest + React Testing Library
- **E2E:** Playwright (cuando el proyecto lo requiera)

## Convenciones

- Archivos de test: `{nombre}.test.ts` o `{nombre}.test.tsx`
- Ubicación: carpeta `__tests__/` al mismo nivel del código testeado.
- Describir tests en inglés para consistencia con el código.

## Qué testear (prioridad MVP)

1. **Validadores Zod** — Los schemas de input son críticos.
2. **API Routes** — Especialmente auth y multi-tenancy (filtro por dealershipId).
3. **Funciones de negocio** en `lib/` — Lógica pura, fácil de testear.
4. **Componentes complejos** — Solo si tienen lógica significativa.

## Qué NO testear (en MVP)

- Componentes puramente visuales (UI pura).
- Configuraciones de librerías.
- Código generado (Prisma client).

## Ejemplo

```ts
import { describe, it, expect } from "vitest";
import { vehicleCreateSchema } from "@/lib/validators/vehicle";

describe("vehicleCreateSchema", () => {
  it("should validate a correct vehicle input", () => {
    const input = {
      title: "Toyota Corolla 2023",
      brand: "Toyota",
      model: "Corolla",
      year: 2023,
      price: 25000000,
    };
    expect(vehicleCreateSchema.safeParse(input).success).toBe(true);
  });

  it("should reject negative price", () => {
    const input = { title: "Test", brand: "X", model: "Y", year: 2023, price: -1 };
    expect(vehicleCreateSchema.safeParse(input).success).toBe(false);
  });
});
```