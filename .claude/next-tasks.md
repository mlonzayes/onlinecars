# Next Tasks — OnlineCars

Tareas pendientes priorizadas, identificadas durante implementaciones previas.
No agregar features acá si no están bloqueadas a un trabajo futuro concreto.

---

## API Logging (resuelto en abril 2026)

Se agregó:
- `src/lib/logger.ts` — generador de `request_id` con formato `YYYYMMDDHHmmssSSS_xxxxxxxx` (UTC) + logger JSON estructurado.
- `src/lib/api-handler.ts` — hooks `beforeRequest` / `afterRequest` / `onRequestError` + wrapper `withLogger`.
- Aplicado a los 13 route handlers existentes.

Pendientes que quedaron a partir de ese trabajo:

### 1. Limpieza de deprecations de Zod 4

**Qué:** Reemplazar las APIs deprecadas que ya estaban en el código (no introducidas por el logger):
- `parsed.error.flatten()` → `z.treeifyError(parsed.error)` o `z.flattenError(parsed.error)` (función standalone, no método)
- `z.string().email()` → `z.email()`
- `z.string().url()` → `z.url()`

**Por qué:** Son `severity: Hint` hoy, pero en próximas versiones de Zod pueden romper. Mejor sacarlas de cuajo en una sola pasada.

**Dónde mirar:** Cualquier `route.ts` que use Zod (todos), más los validators en `src/lib/validators/`.

**Estimado:** ~15 minutos de cambios mecánicos.

---

### 2. Rate limiting con Redis en endpoints públicos

**Qué:** Agregar rate limiting a los endpoints bajo `/api/public/tenant/[slug]/*` usando Upstash Redis (`@upstash/redis` ya instalado, cliente en `src/lib/redis.ts`).

**Por qué:** Estos endpoints son accesibles sin auth desde el sitio público del concesionario. Sin rate limit, cualquiera puede:
- Spamear `POST /api/public/tenant/[slug]/leads` y llenarte la base de leads basura.
- Hacer scraping del catálogo público con `GET .../vehicles`.

**Diseño sugerido:**
- Helper `lib/rate-limit.ts` con función `checkRateLimit(identifier, limit, windowSec)`.
- Identifier = IP del request (header `x-forwarded-for` en Vercel) + path.
- Limites diferentes por endpoint:
  - `POST /leads`: 5 requests / 10 min por IP+slug.
  - `GET /vehicles`: 60 requests / 1 min por IP+slug.
- Si excede → 429 con header `Retry-After`.

**Documentado en:** `.claude/rules/api-conventions.md` ("Aplicar rate limiting con Redis en estos endpoints.")

---

### 3. Enmascarar datos sensibles en logs

**Qué:** Hoy el logger no loggea bodies completos (solo IDs y metadata), pero el `details` de errores Zod sí puede incluir valores que el usuario tipeó. Antes de agregar logs más verbosos (ej: bodies de leads con email/teléfono), agregar un helper de masking.

**Por qué:** Compliance + sentido común — un log con emails/teléfonos en claro es problema legal en Argentina (Ley 25.326) y va a dolor cuando crezca la app.

**Diseño sugerido:**
- Helper `lib/log-mask.ts` con función `maskSensitive(obj, fields = ["email", "phone", "whatsapp", "password"])`.
- Aplicarlo en cualquier log que reciba bodies de usuario antes de pasarlo al `logger`.

**Estimado:** ~30 minutos cuando se justifique. Hoy no es urgente porque no estamos loggeando bodies.

---

## Otros pendientes del MVP (de CLAUDE.md)

- Sitio público del concesionario (`(tenant)` route group).
- Webhooks de Clerk para sync de usuarios.
- Email transaccional con Resend.
- Cache Redis del catálogo (cache-aside con invalidación).
- Testing (Vitest + RTL).

---

## Módulo de Ventas — Roadmap

**Phase 1 — DONE (abril 2026)**: Schema (Customer, Sale, SaleDocument, +3 campos en Vehicle) + CRUD de Customer (endpoints + UI).

### Phase 2 — Sale CRUD + máquina de estados

**Qué:**
- Endpoints `/api/ventas` (GET/POST) y `/api/ventas/[id]` (GET/PUT/DELETE).
- Endpoint `PATCH /api/ventas/[id]/status` con validación de transiciones permitidas.
- Lógica de negocio: al pasar a `reserved`, marcar `Vehicle.status = "reserved"`. Al pasar a `completed`, `Vehicle.status = "sold"`. Al `cancelled`, liberar (`available`).
- UI: list (`/dashboard/ventas`) + form de nueva venta (`/dashboard/ventas/nueva`) que selecciona Vehicle disponible + Customer existente o crea uno nuevo. Detail (`/dashboard/ventas/[id]`) con tabs Resumen/Cliente/Vehículo/Documentos/Cierre.
- Estados visuales y badges. Botones de transición de estado en el detail.

**Estados permitidos (máquina):**
```
draft       → reserved | cancelled
reserved    → in_progress | cancelled
in_progress → completed | cancelled
completed   → (terminal)
cancelled   → (terminal, requiere cancelReason)
```

### Phase 3 — Documentos del legajo

**Qué:**
- Endpoint `POST /api/ventas/[id]/documentos` (FormData, re-usa el `storage` provider del módulo de imágenes).
- Endpoint `DELETE /api/ventas/[id]/documentos/[docId]`.
- Helper `getRequiredDocs(sale, vehicle, thresholds)` que devuelve los tipos de doc requeridos según `condition` del vehículo y `salePrice`.
- UI: panel de checklist en la tab Documentos del detail. Verde si está subido, rojo si falta. Categorías: Cliente / Vehículo / Operación.
- Soporte para PDFs además de imágenes — extender `ALLOWED_IMAGE_TYPES` o crear `ALLOWED_DOCUMENT_TYPES`.
- Ampliar `storage` abstraction para aceptar archivos de hasta ~10MB (PDFs son más pesados que imágenes).

### Phase 4 — Mocks AFIP / DNRPA + cierre de venta

**Qué:**
- `src/lib/integrations/afip.ts` — provider con interface `InvoiceProvider`. Mock que devuelve `{ invoiceNumber: "MOCK-...", cae: "0...", _mock: true }` con log "próximamente".
- `src/lib/integrations/dnrpa.ts` — idem para Form 08 Digital.
- Endpoint `POST /api/ventas/[id]/factura` que llama al provider, marca `Sale.invoiceNumber/invoiceDate`, y crea un `SaleDocument` tipo `FACTURA_AFIP` (con un PDF placeholder o el JSON del mock).
- Endpoint `POST /api/ventas/[id]/form08` idem para DNRPA.
- UI: en la tab "Cierre" del detail, botones "Emitir factura" y "Generar F08" con un cartel **"Próximamente: integración real"**. Al hacer click, dispara el mock y refresca la venta.
- Acta de Entrega: input simple para fecha + botón "Marcar como entregado" que setea `deliveryDate` y mueve a `completed`.

### Cuando se implementen las integraciones reales

- AFIP WSFE: usar `wsaa-client` (autenticación con certificado X.509) + WSFE SOAP. Reemplazar `afipMock` por `afipReal` en `integrations/index.ts`.
- DNRPA Form 08 Digital: requiere convenio con DNRPA, no es API pública. Probablemente quede como mock + integración manual por mucho tiempo.

---

## Storage de imágenes — BLOQUEANTE para deploy

Estado actual (abril 2026):
- Storage abstraction implementada en `src/lib/storage/` con dos providers: `local` y `s3`.
- El driver `local` escribe a `/public/uploads/` — **solo funciona en dev**.
- El driver `s3` está como stub: tira "not implemented" si se usa.
- Endpoints `POST/DELETE/PUT` para imágenes ya andan contra cualquier provider.
- UI con drag-drop, reorder y delete ya integrada en el form de vehículos (tab "Imágenes" en edit mode).

### 4. Implementar `src/lib/storage/s3.ts` antes del deploy

**Por qué bloqueante:** En Vercel Serverless Functions el filesystem es read-only en runtime. Si deployás con `STORAGE_DRIVER=local` (default), cualquier upload va a tirar `EROFS` y romper el form de vehículos.

**Qué hay que hacer:**
1. Crear bucket en Cloudflare R2 (recomendado) o S3.
2. Configurar CORS del bucket para permitir uploads desde el dominio del dashboard (`app.onlinecars.com.ar`).
3. Setear las env vars `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` en Vercel.
4. Implementar `s3.ts`:
   - `upload`: usar `PutObjectCommand` del `@aws-sdk/client-s3` (ya instalado). El `url` retornado debe apuntar al dominio público del bucket.
   - `delete`: `DeleteObjectCommand`.
5. En `next.config.ts`, agregar el dominio del bucket a `images.remotePatterns` para que `next/image` pueda servirlas.
6. Setear `STORAGE_DRIVER=s3` en Vercel.
7. Considerar también: el helper de delete en `src/app/api/vehiculos/[id]/images/[imageId]/route.ts` deriva el `key` desde la URL haciendo `url.replace(/^\/uploads\//, "")`. Cuando la URL sea de R2 (https://...), ese parsing tiene que cambiar — preferiblemente moverlo a una función en cada provider que extraiga el key desde la URL.

**Estimado:** ~1-2 horas si el bucket ya está creado.

### 5. (Opcional) Agregar columna `key` a `VehicleImage`

Hoy derivamos el storage key desde la URL parseando el prefijo. Una migración que agregue `key String` al modelo elimina el parsing y deja el código más sano. No es urgente — funciona sin esto. Cuando se justifique tocarlo.
