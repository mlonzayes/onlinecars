# Tracking de Meta (Pixel + Conversions API)

Convención para medir campañas de Meta (Facebook / Instagram). Aplica a **dos
superficies independientes** que no se mezclan nunca:

| Superficie | Qué mide | Pixel de quién | De dónde sale la config |
|---|---|---|---|
| **Web principal** (`motorflowapp.com`) | Nuestro funnel de venta del SaaS | Nuestro | Env vars |
| **Sitio del tenant** (`{slug}.motorflowapp.com`) | Las campañas del concesionario | Del dealer | Columnas en `Dealership` |

Un visitante del sitio de un concesionario **no** entra a nuestro pixel, y
viceversa. Si eso se rompe, nuestros públicos similares se llenan de gente que
buscaba un auto usado y nunca fue prospecto nuestro.

---

## Variables de entorno (web principal)

Van en `.env.local`. No hay `.env.example` en el repo — los archivos `.env*`
están protegidos.

```env
# Business Manager → Administrador de eventos → Orígenes de datos.
# Su PRESENCIA es el interruptor del tracking: vacía = no se renderiza nada.
NEXT_PUBLIC_META_PIXEL_ID=

# Pestaña Configuración → API de conversiones → Generar token de acceso.
# SECRETO: sin prefijo NEXT_PUBLIC.
META_CAPI_ACCESS_TOKEN=

# ⚠️ VACÍO EN PRODUCCIÓN. Con un código cargado, Meta marca los eventos como
# prueba y NO cuentan como conversiones reales de campaña.
META_CAPI_TEST_EVENT_CODE=
```

**Un solo interruptor a propósito.** No existe un `META_TRACKING_ENABLED`
aparte: dos switches para lo mismo terminan siempre en "estaba prendido pero no
medía". Para apagar, vaciás el pixel id.

---

## Piezas

| Archivo | Rol |
|---|---|
| [src/lib/meta/config.ts](../../src/lib/meta/config.ts) | Config pública. **Client-safe** — solo `NEXT_PUBLIC_*`. |
| [src/lib/meta/capi.ts](../../src/lib/meta/capi.ts) | Cliente de la Conversions API. **SERVER-ONLY**. |
| [src/lib/meta/hash.ts](../../src/lib/meta/hash.ts) | Normalización + SHA-256 de los datos personales. |
| [src/lib/meta/events.ts](../../src/lib/meta/events.ts) | Eventos estándar + qué significa cada uno acá. |
| [src/lib/meta/client.ts](../../src/lib/meta/client.ts) | Wrapper de `fbq` en el browser. |
| [src/components/meta/meta-pixel.tsx](../../src/components/meta/meta-pixel.tsx) | Inyecta el script + PageView en cambios de ruta. |
| [src/components/meta/meta-track-event.tsx](../../src/components/meta/meta-track-event.tsx) | Dispara un evento de vista al montar. |

### Dónde se monta el pixel

- **Web principal** → [src/app/(marketing)/layout.tsx](<../../src/app/(marketing)/layout.tsx>), UNA sola vez.
- **Tenant** → [src/app/tenant/[slug]/layout.tsx](../../src/app/tenant/%5Bslug%5D/layout.tsx).

**No montarlo en el root layout.** El root envuelve también el dashboard, el
panel de admin y los sitios de los concesionarios.

**Página de marketing nueva → va dentro del route group `(marketing)`,** o no se
mide. El route group no cambia la URL (`/precios` sigue siendo `/precios`).

**El pixel del tenant NO va en `<TenantChrome>`,** aunque tiente: ese componente
lo reusa `/vista-previa`, y el dealer previsualizando su sitio se contaría a sí
mismo como visita.

---

## LA regla: deduplicación

El mismo evento se manda **dos veces** — por el pixel del browser y por la
Conversions API del server. Meta los une en uno solo si comparten
`event_name` + `event_id`.

**El `eventId` lo genera el CLIENTE y viaja al server en el body.**

```ts
// Client
const metaEventId = trackMetaEventWithId("Lead", { contentName: "..." });
await fetch("/api/...", {
  body: JSON.stringify({ ...payload, [META_EVENT_ID_FIELD]: metaEventId }),
});

// Server
const eventId = parsed.data[META_EVENT_ID_FIELD] ?? globalThis.crypto.randomUUID();
```

Si cada lado genera el suyo, **contás cada conversión el doble** y tomás
decisiones de inversión con el ROAS inflado. Es el bug más caro de esta
integración y no da ningún síntoma: el sitio anda perfecto.

El fallback a un uuid random cuando el campo no llega es correcto: significa que
el pixel nunca corrió (adblocker), así que no hay nada con qué deduplicar — y
ese es justamente el caso que la CAPI viene a cubrir.

---

## Por qué la CAPI no es opcional

Entre adblockers, el ITP de Safari y el opt-out de iOS, el pixel del browser
pierde **entre 20% y 40%** de las conversiones. Y Meta optimiza la campaña con
lo que recibe: si le llega la mitad de los leads, concluye que convertís poco y
te sube el costo por lead. La CAPI no la bloquea nadie.

---

## Reglas no obvias

1. **`after()`, no `void`.** Los eventos de CAPI se mandan con `after()` de
   `next/server`. En Vercel, una promesa suelta después del `return` se puede
   cortar cuando la función se congela. Telegram usa `void` porque perder un
   aviso es molesto; perder una conversión te desoptimiza la campaña.

2. **Fail-open, siempre.** Si Meta está caído, con rate limit o el token venció,
   se loggea y se sigue. Mismo criterio que el rate limit de Upstash: perder una
   métrica es malo, perder el lead del cliente es inaceptable.

3. **Nunca PII en los logs.** Se loggea `eventName`, `eventId` y `pixelId` (que
   es público, está en el HTML). Jamás el email, el teléfono ni el token.

4. **La normalización ANTES del hash no es cosmética.** `Juan@Gmail.com ` y
   `juan@gmail.com` dan hashes distintos y el match no ocurre. Ver `hash.ts`:
   sigue la spec de Meta al pie de la letra. Un match malo no falla
   ruidosamente — te deja el Ads Manager mostrando 3 conversiones donde hubo 12.

5. **`client_ip_address`, `client_user_agent`, `fbp` y `fbc` van EN CLARO.**
   Hashearlos rompe el match en vez de proteger algo: Meta ya los recibe del
   browser.

6. **`_fbc` es la cookie que importa.** Guarda el click id del anuncio, o sea la
   prueba de que esta persona vino de una publicidad tuya. Sin ella Meta no
   atribuye la conversión y la campaña "no funciona" en el reporte. Si el
   visitante llegó recién de un ad, la cookie puede no estar escrita todavía —
   por eso `extractMetaBrowserSignals` la reconstruye desde el `fbclid` de la
   URL.

7. **`fbq` no detecta las navegaciones del App Router.** El snippet oficial de
   Meta asume MPA. Sin el `useEffect` sobre `pathname`, un visitante recorre 5
   páginas y Meta ve 1. Y el efecto **saltea su primera corrida**, porque el
   PageView inicial ya lo dispara el snippet inline.

8. **`MetaTrackEvent` reintenta a propósito.** El script se inyecta con
   `afterInteractive` y no hay garantía de orden contra el efecto del
   componente. Si `window.fbq` todavía no existe, el evento se pierde en
   silencio.

9. **Eventos estándar, no custom.** Los estándar habilitan optimización de
   campaña, públicos similares y las columnas de conversión del Ads Manager. Un
   evento con nombre inventado no te da nada de eso.

---

## Seguridad del token del tenant

`Dealership.metaCapiToken` es un **secreto del dealer**. Reglas:

- **No sale del server.** El `GET /api/concesionario` lo strippea y devuelve
  `hasMetaCapiToken: boolean` en su lugar. Devolverlo para rellenar un input es
  cómodo y es exactamente cómo se filtran los secretos.
- **No entra a ningún Client Component.** `MetaPixelCard` recibe
  `hasCapiToken`, nunca el valor. Toda prop que le pases a un Client Component
  viaja al browser en el payload de React.
- **No entra al bundle del tenant.** `TenantHomeBundleDealership` enumera sus
  campos uno por uno — no agregarlo ahí.
- **Ojo:** `getDealershipBySlug` cachea el `Dealership` completo en Redis, token
  incluido. Es cache server-side y no se expone, pero tenerlo presente si algún
  día ese valor se devuelve por un endpoint.

`metaPixelId` **sí** es público: se renderiza en el HTML del sitio.

---

## Gating por plan

`allowMetaPixel` en [src/lib/plans.ts](../../src/lib/plans.ts) — plan **Media**
para arriba, mismo escalón que la integración de ML.

Se chequea en **tres** lugares, y ninguno sobra:

1. `MetaPixelCard` — la UI muestra el estado bloqueado con CTA de upgrade.
2. `PUT /api/concesionario` — descarta la config y fuerza el toggle en false.
   Defensa server-side: un POST a mano no alcanza para activarlo.
3. **Al leer** (tenant layout + handler de leads) — si el dealer configura el
   pixel en plan Media y después **baja a Base**, la config queda en la DB. Sin
   este tercer chequeo seguiría trackeando una feature que ya no paga.

---

## Cómo verificar que anda

1. Instalá la extensión **Meta Pixel Helper** (Chrome) y abrí el sitio: tiene
   que detectar el pixel y un `PageView`.
2. Cargá `META_CAPI_TEST_EVENT_CODE` y abrí Events Manager → **Eventos de
   prueba**. Mandá el form: tienen que aparecer **dos** entradas del `Lead`
   (Browser y Server) que Meta muestra como **deduplicadas**. Si aparecen como
   dos conversiones separadas, el `eventId` no está viajando.
3. En los logs buscá `meta.capi.sent` (ok) o `meta.capi.rejected` / 
   `meta.capi.failed` (con el motivo).
4. **Sacá el `META_CAPI_TEST_EVENT_CODE` antes de lanzar campañas.**

---

## Checklist para sumar un evento nuevo

- [ ] Es un evento **estándar** de `META_STANDARD_EVENTS`
- [ ] Documentado en `META_EVENT_PURPOSE` qué significa en este producto
- [ ] Si es una conversión: se dispara en las **dos** puntas con `eventId` compartido
- [ ] El server usa `after()`, no `void` ni `await` bloqueante
- [ ] Los datos personales pasan por `buildHashedUserData`
- [ ] No se loggea PII
- [ ] Si es del tenant: chequea plan **y** credenciales antes de mandar
