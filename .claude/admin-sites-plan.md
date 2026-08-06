# Panel de plataforma — control de sitios y plantillas

Plan de la sección de `/admin` para (a) prender/apagar el sitio público de cada
cliente, (b) armarle la web a un cliente que pide diseño custom usando el motor
que ya existe, y (c) crear plantillas y versiones nuevas sin deploy.

## El techo que condiciona todo el diseño

Una plantilla se parte en dos mitades, y la línea la marca `next/font`:

| Mitad | Vive en | ¿Se crea desde el panel? |
|---|---|---|
| Tokens (colores, radius, sombras), preset de secciones, copy, flags de layout | **Datos** (DB) | **Sí**, sin deploy |
| Fuente tipográfica y estructura de un layout realmente nuevo | **Código** | No — requiere deploy |

`next/font` NO soporta selección dinámica: las fuentes se declaran al top-level
del módulo y se resuelven en build time (ya está documentado en
[tenant-templates.ts](../src/lib/tenant-templates.ts)). La mitigación es un
**catálogo de fuentes precargadas**: declarás 8-10 en código y desde el panel
elegís cuál usa cada plantilla. Sumar una fuente al catálogo son ~4 líneas.

No hay forma de esquivar esto. Cualquier promesa de "plantillas 100% desde el
panel" choca contra esta pared.

---

## Fase 1 — Control de sitios ✅ HECHO

Sección `/admin/sitios`: ver el estado del sitio de cada cuenta, prenderlo,
pausarlo, cambiarle la plantilla y previsualizarlo antes de publicarlo.

**Archivos:**

| Archivo | Qué hace |
|---|---|
| [admin/layout.tsx](../src/app/admin/layout.tsx) | Guard de super-admin centralizado + nav de secciones |
| [admin-nav.tsx](../src/components/admin/admin-nav.tsx) | Tabs "Cuentas · Sitios" |
| [admin/sitios/page.tsx](../src/app/admin/sitios/page.tsx) | Listado, pausados arriba (son los que piden acción) |
| [sites-table.tsx](../src/components/admin/sites-table.tsx) | Tabla + resolución del estado real del sitio |
| [site-row-actions.tsx](../src/components/admin/site-row-actions.tsx) | Toggle ON/OFF, selector de plantilla, link a preview |
| [api/admin/dealerships/[id]](../src/app/api/admin/dealerships/[id]/route.ts) | PATCH extendido + invalidación de cache |
| [validators/admin.ts](../src/lib/validators/admin.ts) | `siteEnabled` + `templateId` + `touchesPublicSite()` |
| [vista-previa/page.tsx](../src/app/vista-previa/page.tsx) | `?dealership={id}` para preview cross-tenant (solo super-admin) |

**Decisiones no obvias:**

1. **El PATCH del admin invalida el cache del tenant.** Antes no lo hacía y no
   importaba (solo tocaba plan y suscripción, que no salen en el sitio público).
   Con `siteEnabled` sí importa: `getDealershipBySlug` cachea el dealership en
   Redis con TTL de 30 min, así que apagar un sitio sin invalidar lo dejaría
   vivo hasta media hora. Lo resuelve `touchesPublicSite()` — si sumás un campo
   nuevo que se vea en el sitio, **agregalo a `PUBLIC_SITE_FIELDS`**.

2. **"Online" ≠ `siteEnabled`.** `getDealershipBySlug` exige `active &&
   siteEnabled`. Una cuenta dada de baja tiene el sitio en 404 aunque el toggle
   esté prendido. Por eso el estado en la tabla tiene tres valores y el toggle
   se deshabilita si la cuenta está de baja: mostrar "Pausado" ahí te haría
   diagnosticar mal el 404.

3. **La preview cuelga de `/vista-previa`, no de `/admin`.** Reusa la página que
   ya existía (que arma el bundle sin gatear por `siteEnabled`) y evita que el
   sitio del tenant quede envuelto en el layout del panel. El param `?dealership`
   solo lo honra un super-admin; para cualquier otro usuario se ignora en
   silencio y ve su propio sitio.

4. **Los ids de plantilla dejaron de estar hardcodeados en los validators.**
   `TENANT_TEMPLATE_ID_TUPLE` es la fuente única. Antes
   `dealershipUpdateSchema` tenía `["classic","dark","impacto"]` a mano y sumar
   una plantilla dejaba el validator desincronizado.

**Pendiente conocido:** suspender una cuenta (`subscriptionStatus: suspended`)
NO baja el sitio público — solo bloquea el dashboard. Si el criterio comercial
es "no paga, no tiene web", hay que sumar `subscriptionStatus` al gate de
`getDealershipBySlug` y a `PUBLIC_SITE_FIELDS`. Es una decisión de producto, no
un bug.

---

## Fase 2 — Modo plataforma ✅ HECHO

Entrar al site-builder que ya existe pero operando sobre la cuenta de un
cliente, para armarle la web vos mismo.

**Alcance: solo el sitio web.** No alcanza a vehículos, ventas, clientes ni a los
legajos (que tienen DNI y facturas de terceros).

**Archivos:**

| Archivo | Qué hace |
|---|---|
| [lib/admin-context.ts](../src/lib/admin-context.ts) | `resolveSiteBuilderContext()`, `getPlatformEditTargetId()`, `auditFields()` |
| [api/admin/impersonation](../src/app/api/admin/impersonation/route.ts) | POST entrar / DELETE salir |
| [admin/sitios/[id]/editar](../src/app/admin/sitios/[id]/editar/page.tsx) | El editor, componiendo el builder existente |
| [platform-edit-banner.tsx](../src/components/admin/platform-edit-banner.tsx) | Banner sticky + salir |
| [platform-edit-activate.tsx](../src/components/admin/platform-edit-activate.tsx) | Pantalla de activación (entrada directa por URL) |

**Decisiones no obvias:**

1. **NO se tocó `getCurrentDealership()`.** Era la opción tentadora — cambiás una
   función y el motor entero opera sobre otro tenant. Pero esa función es el
   corazón del multi-tenancy: la usan `/dashboard/ventas`, `/clientes` y los
   legajos. El override vive en `resolveSiteBuilderContext()`, aplicado SOLO en
   los 9 handlers del builder. El alcance queda acotado por construcción.

2. **`usuarios/invitar` quedó afuera a propósito.** Cuelga de
   `/api/concesionario/*` pero NO es site-builder. Un reemplazo a lo bruto te
   habilitaba a invitar usuarios a la cuenta del cliente.

3. **El editor NO reusa `/dashboard/sitio-web`.** El layout del dashboard tiene
   tres gates que expulsan al super-admin: `/onboarding` si no tiene
   concesionario propio, `/aceptar-terminos` si no firmó T&C, y `/cuenta-pausada`
   si la cuenta está suspendida — justo el caso donde más querrías entrar.
   Además el sidebar mostraría el tenant equivocado. Por eso el editor vive en
   `/admin/sitios/[id]/editar` y COMPONE los mismos componentes del builder. No
   hay lógica duplicada: solo el armazón de la página.

4. **La cookie no está firmada, y está bien.** La cookie solo dice "sobre qué
   cuenta"; la autorización es `isSuperAdmin(userId)` re-verificada en CADA
   request. Un usuario común que la forje ve su propia cuenta. Lo peor que logra
   un super-admin manipulándola es apuntar a otro dealership — que es lo que el
   modo le permite igual. TTL de 2h para que el modo se abandone solo.

5. **Guard anti-footgun en `/dashboard/sitio-web`.** Con el modo activo esa
   página leería el sitio PROPIO mientras los componentes del builder guardan en
   el del cliente: verías tus secciones y escribirías las de otro. Con la cookie
   puesta, redirige al editor correcto.

6. **`currentUser` sintético.** El super-admin no tiene fila en `DealershipUser`
   para esa cuenta y no queremos crearla (ensuciaría el conteo de usuarios del
   plan del cliente). El `id` es un centinela, no un cuid — seguro hoy porque el
   código solo lee `currentUser.role`. Si algún día se escribe `currentUser.id`
   en DB, revienta con un FK error: preferible a una fila fantasma.

7. **Whitelist server-side en el PUT.** `PLATFORM_EDITABLE_FIELDS` limita el modo
   a campos de diseño. La UI no expone `usdSpread` ni `currency`, pero el
   endpoint es el mismo que usa el dealer. Devuelve 403 en vez de strippear en
   silencio: si el editor manda un campo nuevo, queremos enterarnos.

8. **Auditoría:** toda mutación del builder loggea `actingSuperAdmin` vía
   `auditFields(ctx)`. En modo normal devuelve `{}` y no ensucia los logs.

---

## Fase 3 — Plantillas en DB + versiones

Objetivo: clonar una plantilla, tocarle los tokens y publicarla como versión
nueva sin deploy. Y poder marcar una plantilla como exclusiva de un cliente.

**Modelo:**

```prisma
model SiteTemplate {
  id          String  @id @default(cuid())
  key         String  @unique          // "classic", "impacto", "impacto-v2"
  name        String
  description String
  tone        String                    // light | dark
  fontId      String                    // clave del FONT_REGISTRY (código)
  tokens      Json                      // { "--tenant-bg": "#fff", ... }
  flags       Json?                     // { hasAnnouncementBar, solidHeader }
  sectionPreset Json?                   // qué secciones, en qué orden, con qué config
  status      String  @default("draft") // draft | published | archived
  // null = pública (todos los dealers la ven en su selector).
  // Con valor = exclusiva de ese dealership → el diseño custom.
  ownerDealershipId String?
  version     Int     @default(1)
  parentKey   String?                   // de qué plantilla se clonó
  @@map("site_templates")
}
```

**Pasos:**

1. **`FONT_REGISTRY` en código** — `{ poppins, spaceGrotesk, unbounded, ... }`,
   todas declaradas al top-level como hoy. `fontId` indexa acá.
2. **Migración + seed** de las tres plantillas actuales como filas `published`.
3. **`resolveTemplate` pasa a async y cacheado.** Hoy es sync y la usan
   `tenant-chrome` y `sites-table`. Va con cache-aside en Redis (TTL largo,
   invalidado al editar la plantilla) o metida dentro del bundle del home, que
   ya está cacheado. **Sin cache, esto es una query por render de página
   pública** — no negociable.
4. **`/admin/plantillas`**: listar, clonar, editor de tokens con color pickers,
   preview en vivo (reusar `TemplatePreview`), publicar/archivar, asignar
   exclusividad a un dealer.
5. **El selector del dealer** ([template-selector.tsx](../src/components/dashboard/settings/template-selector.tsx))
   pasa a leer de DB: solo `published` públicas + las suyas.
6. **"Aplicar preset de secciones"** — acción del panel que siembra
   `DealershipSection` según el `sectionPreset`. **Es destructivo** (pisa el copy
   custom del dealer): va con `ConfirmDialog` y aviso explícito.

**Orden sugerido:** 3a = modelo + migración + seed + lectura desde DB con la UI
intacta (nadie nota nada). 3b = el editor en `/admin`. Partirlo así deja el
riesgo de la migración separado del riesgo de la UI nueva.
