# Filtros y ordenamiento en listados del panel

Patrón compartido para agregar filtros (`<select>`) y ordenamiento a cualquier
listado de `/dashboard/*`. Implementado primero en **vehículos** — usar esa
pantalla como referencia viva.

> **Antes existía copy-paste.** `sales-status-select.tsx` y `quotations-filters.tsx`
> repiten la misma lógica con la ruta hardcodeada adentro. Son **legacy**: no
> copiarlos. Cuando toques esos módulos, migralos a este patrón.

## Por qué así

- **Todo vive en la URL.** Bookmarkeable, soporta back/forward, y el filtrado
  ocurre en SQL (no en el cliente sobre una página ya paginada, que daría
  resultados incorrectos).
- **La pantalla no decide nada.** Filtros y órdenes se DECLARAN en
  `src/lib/table/<modulo>-table-params.ts`. La page solo resuelve y renderiza.
- **El usuario nunca toca Prisma.** Ver la sección de seguridad más abajo.

## Piezas

| Archivo | Rol |
|---|---|
| [src/lib/table/query-params.ts](../../src/lib/table/query-params.ts) | Contratos y resolvers genéricos. No tocar por módulo. |
| [src/lib/table/vehicle-table-params.ts](../../src/lib/table/vehicle-table-params.ts) | Declaración concreta de un módulo. **Este es el archivo a copiar.** |
| [src/hooks/use-url-filters.ts](../../src/hooks/use-url-filters.ts) | Escritura en la URL. Usa `usePathname()`, sirve en cualquier pantalla. |
| [src/components/dashboard/table-toolbar.tsx](../../src/components/dashboard/table-toolbar.tsx) | La barra: búsqueda + "Filtrar" + "Ordenar" en una fila. |
| [src/components/dashboard/url-filter-menu.tsx](../../src/components/dashboard/url-filter-menu.tsx) | Botón "Filtrar" con TODAS las categorías adentro + contador de activos. |
| [src/components/dashboard/url-sort-menu.tsx](../../src/components/dashboard/url-sort-menu.tsx) | Botón "Ordenar" con todos los criterios. |

### Layout

Los tres elementos van en la MISMA fila; la búsqueda se estira y los botones
quedan a la derecha (en mobile se apilan a ancho completo):

```
[ Buscar por marca, modelo, patente...        ] [ Filtrar ② ] [ Ordenar ]
```

Los filtros van agrupados en un solo botón y no como selects sueltos: con tres
o más filtros, una fila de selects tapa la pantalla antes de mostrar un dato.
Agrupados, la barra siempre ocupa lo mismo y el contador del botón dice de un
vistazo cuántos hay activos.

## SEGURIDAD: el orden nunca se construye con input del usuario

**Esto no es negociable.** Jamás armes un `orderBy` interpolando el query string:

```ts
// ❌ NUNCA. Un ?sort= arbitrario llega crudo a la DB.
orderBy: { [searchParams.sort]: searchParams.dir }
```

El `value` de la URL solo sirve para **buscar** en una lista que escribimos
nosotros. Si no matchea, cae al default:

```ts
// ✅ resolveSort() es la barrera. Devuelve siempre un orderBy de la whitelist.
const sort = resolveSort(params.sort, VEHICLE_SORT);
// ...
prisma.vehicle.findMany({ where, orderBy: sort.orderBy });
```

Mismo criterio para los filtros: `resolveFilter()` devuelve `"all"` si el valor
no está en las opciones declaradas.

**Los objetos `orderBy` no viajan al cliente.** El Client Component recibe solo
`{ value, label }` vía `toClientSortOptions()`. La forma de las queries no entra
en el bundle del browser.

## Receta: sumar filtros a un módulo nuevo

### 1. Declarar filtros y orden

`src/lib/table/<modulo>-table-params.ts`:

```ts
import type { Prisma } from "@prisma/client";
import { CUSTOMER_TYPES, CUSTOMER_TYPE_LABELS } from "@/lib/constants";
import { isFilterActive, searchTokens, type FilterDefinition, type SortDefinition } from "./query-params";

export const CUSTOMER_TYPE_FILTER: FilterDefinition = {
  param: "type",                    // nombre del query param
  allLabel: "Todos los tipos",      // texto del trigger sin filtrar
  // Derivar de constants.ts siempre que exista: si se agrega un valor al
  // `as const`, la opción aparece sola.
  options: CUSTOMER_TYPES.map((value) => ({ value, label: CUSTOMER_TYPE_LABELS[value] })),
};

export const CUSTOMER_FILTERS = [CUSTOMER_TYPE_FILTER] as const;

// Tipar el SortDefinition con el OrderBy del modelo hace que el compilador
// valide los nombres de campo. Si renombrás una columna, esto rompe en tsc.
export const CUSTOMER_SORT: SortDefinition<Prisma.CustomerOrderByWithRelationInput> = {
  param: "sort",
  defaultValue: "recent",
  options: [
    { value: "recent", label: "Más recientes primero", orderBy: { createdAt: "desc" } },
    { value: "name-asc", label: "Nombre (A-Z)", orderBy: { firstName: "asc" } },
  ],
};

export function buildCustomerWhere({ dealershipId, search, type }): Prisma.CustomerWhereInput {
  const tokens = searchTokens(search);
  return {
    dealershipId,                                    // NUNCA omitir: multi-tenancy
    ...(tokens.length > 0 ? { AND: tokens.map(/* OR de campos */) } : {}),
    ...(isFilterActive(type) ? { type } : {}),       // solo si está activo
  };
}
```

### 2. Resolver en la page (Server Component)

```tsx
const params = await searchParams;
const search = params.q?.trim() ?? "";
const page = parsePage(params.page);

const type = resolveFilter(params.type, CUSTOMER_TYPE_FILTER);
const sort = resolveSort(params.sort, CUSTOMER_SORT);

const where = buildCustomerWhere({ dealershipId: dealership.id, search, type });

const [total, items] = await Promise.all([
  prisma.customer.count({ where }),
  prisma.customer.findMany({ where, skip, take: PAGE_SIZE, orderBy: sort.orderBy }),
]);
```

Ampliar el tipo de `searchParams` con los params nuevos.

### 3. Renderizar la barra

El buscador va como **children** — así queda en la misma fila que los botones:

```tsx
<TableToolbar
  filters={CUSTOMER_FILTERS}
  values={{ [CUSTOMER_TYPE_FILTER.param]: type }}
  sort={{
    param: CUSTOMER_SORT.param,
    options: toClientSortOptions(CUSTOMER_SORT),
    value: sort.value,
  }}
>
  <TableSearch placeholder="Buscar por nombre o documento..." ariaLabel="Buscar clientes" />
</TableToolbar>
```

El botón "Limpiar filtros" aparece solo dentro del menú de filtros cuando hay
alguno activo. No hace falta configurarlo.

## Performance: qué hacer en cada listado

Un listado con filtros se re-renderiza entero en **cada** cambio de filtro, orden
o página. Sin cuidado, eso son 6-7 queries por click. Checklist:

### 1. Stats cacheados con `unstable_cache` + tag

Los contadores de los stat cards NO dependen de los filtros: cachearlos.
Declarar el tag en [src/lib/cache-tags.ts](../../src/lib/cache-tags.ts) e
invalidarlo desde **todo** handler que mute el recurso.

```ts
const getCachedStats = unstable_cache(
  async (dealershipId: string) => { /* counts */ },
  ["vehicles-stats"],
  { tags: ["vehicles-stats"], revalidate: 3600 }
);
```

**Un stat card desactualizado es peor que uno lento** — el dealer decide mirando
esos números. Ojo con las invalidaciones cruzadas: una venta cambia el status del
vehículo, así que mueve los stats de DOS listados. Por eso existe
`invalidateSaleCaches()`.

### 2. Un `groupBy` en vez de N counts

```ts
// ❌ 3 queries
count({ where: { dealershipId } }),
count({ where: { dealershipId, status: "reserved" } }),
count({ where: { dealershipId, status: "sold" } }),

// ✅ 1 query
groupBy({ by: ["status"], where: { dealershipId }, _count: { _all: true } })
```

### 3. Derivar el `total` del cache cuando no hay filtros

Sin filtros ni búsqueda, el total de la paginación **es** el total cacheado:

```ts
filtersActive ? prisma.vehicle.count({ where }) : Promise.resolve(0)
// ...
const total = filtersActive ? filteredCount : stats.totalAll;
```

### 4. No traer relaciones que no se van a mostrar

Si un dato depende de un permiso, condicionar el `include` — no traerlo y
descartarlo después:

```ts
include: {
  expenses: canViewCosts ? { select: { amount: true, currency: true } } : false,
}
```

### 5. Índices que respalden el orden por defecto

**El más olvidado.** Si el listado ordena por `createdAt desc` y solo existe
`[dealershipId, status]`, Postgres escanea todo el stock del dealer y ordena en
memoria en cada carga. Hace falta `@@index([dealershipId, createdAt])`, y uno por
cada columna que se filtre seguido.

Al agregar índices, generá la migración y **verificá que los nombres coincidan**
con los que produce Prisma, o vas a tener drift:

```bash
pnpm exec prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script | grep 'INDEX "tabla'
```

### 6. Loader durante la navegación

Filtrar navega a la misma ruta con otros searchParams: React mantiene la UI vieja
mientras el servidor responde y **`loading.tsx` no se dispara**. Sin feedback, la
pantalla parece colgada.

Envolver el listado en `<TableTransitionProvider>` y la tabla en
`<TableTransitionOverlay>`: comparten un `useTransition`, así el componente que
navega y el que muestra el spinner hablan del mismo `isPending`.

```tsx
<TableTransitionProvider>
  <TableToolbar ...><TableSearch ... /></TableToolbar>
  <TableTransitionOverlay>
    <MiTabla ... />
    <Pagination ... />
  </TableTransitionOverlay>
</TableTransitionProvider>
```

`useUrlFilters` y `TableSearch` se enganchan solos al provider si existe, y caen
a una transición local si no.

## Reglas no obvias

1. **`"all"` no se escribe en la URL.** Es el sentinela de "sin filtrar" y borra
   el param. Un solo estado canónico y URLs limpias.

2. **Cambiar un filtro resetea `?page`.** Lo hace `useUrlFilters` solo. Sin esto,
   filtrar estando en la página 7 muestra una tabla vacía.

3. **Los items de filtro llevan `closeOnClick={false}`.** Son `RadioItem` dentro
   de un menú: sin esa prop, elegir un estado cierra el dropdown y hay que
   reabrirlo para tocar la categoría siguiente. En el menú de **ordenar** es al
   revés — ahí sí cierra, porque se ordena por un criterio a la vez y elegir uno
   es la acción final.

4. **El empty state debe mirar filtros, no solo búsqueda.** Si solo chequeás
   `search`, filtrar por "Vendidos" sin resultados muestra una tabla vacía sin
   explicación. Usar el flag de filtros activos.

5. **Navegación con `scroll: false`.** Al cambiar un filtro se quiere ver la
   tabla, no volver al header.

6. **Ordenar por importe con monedas mixtas miente.** `price` se ordena crudo:
   USD 30.000 queda "por debajo" de ARS 30.000.000. Convertir exigiría la
   cotización del dealer dentro del SQL. Documentado en `VEHICLE_SORT`; aplica
   igual a ventas y cotizaciones.

7. **Cuidado con el `count` derivado del cache.** El patrón de stats cacheados
   (ver CLAUDE.md) permite saltear el `count(where)` cuando NO hay filtros. Con
   filtros activos ese atajo **no vale** — hay que correr el count real.

## Checklist

- [ ] Filtros y orden declarados en `src/lib/table/<modulo>-table-params.ts`
- [ ] `where` construido con helper propio, con `dealershipId` SIEMPRE presente
- [ ] `orderBy` viene de `resolveSort`, nunca del query string
- [ ] Tipo de `searchParams` de la page ampliado
- [ ] `TableToolbar` renderizado con el `<TableSearch />` como children
- [ ] Empty state contempla filtros activos, no solo la búsqueda
- [ ] Stats cacheados con `unstable_cache` + tag declarado en `cache-tags.ts`
- [ ] TODO handler que muta el recurso invalida ese tag (incluidas mutaciones cruzadas)
- [ ] `total` derivado del cache cuando no hay filtros activos
- [ ] Relaciones gateadas por permiso no se traen si no se van a mostrar
- [ ] Existe índice que respalde el orden por defecto (`[dealershipId, createdAt]`)
- [ ] Listado envuelto en `TableTransitionProvider` + `TableTransitionOverlay`
