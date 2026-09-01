# Schema JSON-LD en motorflow

**Nunca escribas `<script type="application/ld+json">` a mano.** Existe
[components/seo/json-ld.tsx](../../../src/components/seo/json-ld.tsx): recibe un
objeto plano y lo serializa. Armás el schema como **objeto TypeScript** en el
Server Component y se lo pasás como prop.

```tsx
import { JsonLd } from "@/components/seo/json-ld";

const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [] };

return (
  <>
    <JsonLd data={faqLd} />
    {/* … */}
  </>
);
```

Reglas que valen para cualquier schema:

- El markup **debe coincidir con lo visible**. Google penaliza el schema que
  describe cosas que el usuario no ve en la página.
- Un bloque por tipo por página.
- Se arma en el **Server Component**, con datos ya resueltos. Nunca con input
  del usuario sin sanitizar (`JsonLd` usa `dangerouslySetInnerHTML`; hoy es
  seguro porque el contenido lo controlamos nosotros — mantenelo así).
- Validá con el Rich Results Test de Google antes de dar por cerrado.
- Las URLs del schema salen de `getTenantPublicUrl(dealership)` o de `SITE_URL`.
  **Nunca hardcodeadas.**

---

## Lo que YA existe (no lo rehagas)

| Schema | Dónde | Punto |
|---|---|---|
| `@graph`: `Organization` + `WebSite` + `SoftwareApplication` (con `Offer` por plan) + **`FAQPage`** | landing — [(marketing)/page.tsx](<../../../src/app/(marketing)/page.tsx>) | 13 |
| `AutoDealer` + `PostalAddress` | home del tenant — [tenant/[slug]/page.tsx](../../../src/app/tenant/[slug]/page.tsx) | 16 |
| `Car` + `Offer` + `seller: AutoDealer` | [ficha de vehículo](../../../src/app/tenant/[slug]/vehiculo/[publicSlug]/page.tsx) | — |
| `BlogPosting` | [blog/[slug]](<../../../src/app/(marketing)/blog/[slug]/page.tsx>) | — |

`AutoDealer` es el `@type` **específico** correcto: cuando existe uno más
preciso que `LocalBusiness`, se usa ese. Ya está bien elegido.

La landing usa **`@graph` con `@id`** para vincular las entidades entre sí
(`publisher: { "@id": ORG_ID }`) en vez de repetir el objeto `Organization` en
cada nodo. Es la forma correcta y ya está resuelta: **si sumás un schema a la
landing, va como nodo nuevo dentro de ese `@graph`**, no como un `<JsonLd>`
suelto al lado.

---

## FAQPage (punto 13) — ✅ implementado en la landing

Ya está en el `@graph` de [(marketing)/page.tsx](<../../../src/app/(marketing)/page.tsx>),
derivado de `getFaqs()` — la **misma** fuente que renderiza el acordeón. Ese es
el patrón a copiar en cualquier página con FAQ (una nota de blog, una futura
página del tenant): nunca dos arrays paralelos, porque cada `Question` del
schema tiene que estar textualmente en la página o Google lo penaliza.

```tsx
const FAQS = [
  { q: "¿Cuánto tarda en estar online mi sitio?", a: "Entre 24 y 48 horas…" },
  { q: "¿Necesito conocimientos técnicos?", a: "No. El panel…" },
] as const;

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};
```

Después renderizás `FAQS` en el acordeón y `<JsonLd data={faqLd} />` en la misma
página. Una sola fuente: si se agrega una pregunta, aparece en los dos lados.

---

## LocalBusiness / AutoDealer (punto 16) — referencia de campos

Ya implementado en la home del tenant. Mirá el archivo antes de tocarlo; esto es
para saber **qué campos faltan** cuando el dealer los tiene cargados.

```ts
const dealerLd = {
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  name: dealership.name,
  url: getTenantPublicUrl(dealership),
  ...(dealership.logo ? { image: dealership.logo } : {}),
  ...(dealership.phone ? { telephone: dealership.phone } : {}),
  address: {
    "@type": "PostalAddress",
    streetAddress: dealership.address,
    addressLocality: dealership.city,
    addressRegion: dealership.province,
    addressCountry: dealership.country ?? "AR",
  },
  // Los tiene el modelo y suman al panel de negocio local:
  ...(dealership.latitude && dealership.longitude
    ? { geo: { "@type": "GeoCoordinates", latitude: dealership.latitude, longitude: dealership.longitude } }
    : {}),
  // socialLinks: Json en el Dealership → sameAs refuerza el vínculo con el perfil.
  ...(socialUrls.length > 0 ? { sameAs: socialUrls } : {}),
};
```

Mínimos que Google espera: `name`, `address` y `telephone` u `openingHours`.
**Campos opcionales solo si el dealer los cargó** — spread condicional, nunca
`undefined` ni un string vacío en el JSON.

`@type` según el rubro, si algún día se abre a otros verticales: `AutoDealer`
(autos), `RealEstateAgent` (inmobiliaria), `Store`, `ProfessionalService`.

---

## Otros schemas que valen la pena acá

- **`BreadcrumbList`** en la ficha de vehículo (Home › Catálogo › Vehículo).
  Genera las migas en el resultado de Google en vez de la URL cruda. Es el que
  más rinde por lo poco que cuesta.
- **`Organization`** + **`WebSite`** (con `SearchAction`) a nivel del dominio de
  marketing, en el root o en `(marketing)/layout.tsx`.
- **`AggregateRating`** dentro de `AutoDealer`, derivado de las `Review`
  **aprobadas** del tenant. Ojo: solo con reviews reales y visibles en la
  página; inventar el rating es penalización directa.
- **`Product` / `Offer`**: ya cubierto por `Car` + `Offer` en la ficha.

No fuerces markup que no describa contenido real y visible.
