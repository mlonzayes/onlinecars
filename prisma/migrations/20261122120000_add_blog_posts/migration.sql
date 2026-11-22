-- Notas del blog de la web principal: dejan de vivir en src/data/posts.ts y se
-- escriben desde /admin/blog. Esta migración crea la tabla y copia las 6 notas
-- que había en el código (el cuerpo pasa de secciones a Markdown).

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tldr" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "faqs" JSONB NOT NULL DEFAULT '[]',
    "sources" JSONB NOT NULL DEFAULT '[]',
    "coverImage" TEXT,
    "authorName" TEXT NOT NULL,
    "authorInitials" TEXT NOT NULL,
    "authorType" TEXT NOT NULL DEFAULT 'Person',
    "authorUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "contentUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_status_publishedAt_idx" ON "blog_posts"("status", "publishedAt");

-- Notas existentes. 12:00 UTC = 9:00 en Argentina, mismo día que la fecha original.

INSERT INTO "blog_posts" ("id", "slug", "title", "excerpt", "category", "body", "tldr", "faqs", "sources", "coverImage", "authorName", "authorInitials", "authorType", "authorUrl", "status", "publishedAt", "createdAt", "updatedAt") VALUES (
  'blogseed01', 'aumentar-consultas-concesionario', 'Cómo aumentar las consultas a tu concesionario en 30 días', 'SEO local, buenas fotos y responder rápido: tres cosas que podés mejorar este mes sin pagar publicidad.', 'marketing',
  '## Aparecé cuando te buscan: SEO local

La mayoría de las búsquedas de autos arrancan en Google con intención local: "concesionaria usados en tu ciudad". Si tu negocio no tiene presencia web propia, esas búsquedas se las llevan los portales y la competencia. Lo desarrollamos en [por qué no alcanza con MercadoLibre para vender autos](/blog/por-que-no-alcanza-mercadolibre).

Tener un sitio con tu marca, tu localidad y tu catálogo indexable hace que aparezcas en esos resultados. Y ese tráfico no lo pagás por click.

## Las fotos venden antes que el precio

Antes de leer el precio, el comprador mira las fotos. Una publicación con imágenes claras, bien iluminadas y desde varios ángulos recibe más consultas que una con fotos oscuras sacadas a las apuradas.

No necesitás equipo profesional: luz natural, fondo limpio y consistencia entre vehículos alcanzan para diferenciarte de la mayoría. Lo desglosamos paso a paso en la [guía rápida para fotografiar autos del concesionario](/blog/guia-fotografiar-autos).

## Respondé rápido o lo perdés

La velocidad de respuesta se descuida mucho. Una consulta contestada en los primeros minutos tiene muchísima más chance de convertir que una respondida al otro día.

Si las consultas están desparramadas entre WhatsApp, mail y portales, alguna se pierde. Tenerlas en un solo lugar te deja contestarlas todas y hacer seguimiento. El panel de leads viene incluido en [todos los planes de motorflow](/precios).',
  ARRAY['Un sitio con tu marca, tu localidad y tu catálogo te hace aparecer en las búsquedas locales de Google, y ese tráfico no lo pagás por click.', 'Las publicaciones con fotos claras, bien iluminadas y desde varios ángulos reciben más consultas que las que tienen fotos oscuras.', 'Contestar en los primeros minutos, y tener todas las consultas en un solo lugar, evita que se te escapen ventas.']::TEXT[], '[]', '[]', '/premium_images/P7_blog_consultas.png',
  'Mateo Lonzayes', 'ML', 'Person', NULL,
  'published', '2026-05-08 12:00:00', '2026-05-08 12:00:00', '2026-05-08 12:00:00'
);

INSERT INTO "blog_posts" ("id", "slug", "title", "excerpt", "category", "body", "tldr", "faqs", "sources", "coverImage", "authorName", "authorInitials", "authorType", "authorUrl", "status", "publishedAt", "createdAt", "updatedAt") VALUES (
  'blogseed02', 'por-que-no-alcanza-mercadolibre', 'Por qué no alcanza con MercadoLibre para vender autos', 'Las comisiones, la dependencia de la plataforma y la pérdida de datos del cliente son tres razones para tener un sitio propio.', 'ventas',
  '## Las comisiones se comen tu margen

Publicar en portales tiene un costo que crece con tu volumen. Cada operación que cerrás pagando comisión es margen que dejás en la mesa de otro.

Con un sitio propio pagás una suscripción fija, así que cuanto más vendés, menos te cuesta cada auto. Hacé la cuenta contra lo que pagás hoy de comisión mirando [los planes y precios de motorflow](/precios).

## Dependés de reglas que no controlás

Los portales cambian tarifas, posicionamiento y reglas cuando quieren. Si un cambio te baja las consultas, no tenés otro canal adonde ir.

Podés seguir publicando en los portales. La idea es que no sean tu único canal.

## Los datos del cliente son tuyos

Cuando una consulta entra por un portal, el vínculo con ese cliente es del portal, no tuyo. Perdés la posibilidad de hacer seguimiento, fidelizar y volver a venderle.

Con sitio propio, cada consulta y cada cliente quedan en tu base, y esa base sigue siendo tuya aunque dejes un portal. Es lo que después usás para lo que explicamos en [cómo aumentar las consultas a tu concesionario en 30 días](/blog/aumentar-consultas-concesionario).',
  ARRAY['Con un sitio propio pagás una suscripción fija en lugar de una comisión por cada venta.', 'Los portales cambian tarifas, posicionamiento y reglas cuando quieren; un canal propio te deja otra salida.', 'Las consultas que entran por tu sitio quedan en tu base, no en la del portal. Podés seguir publicando en los portales.']::TEXT[], '[]', '[]', '/premium_images/P8_blog_mercadolibre.png',
  'MW Studio Digital', 'MW', 'Organization', 'https://mwstudiodigital.com',
  'published', '2026-05-02 12:00:00', '2026-05-02 12:00:00', '2026-05-02 12:00:00'
);

INSERT INTO "blog_posts" ("id", "slug", "title", "excerpt", "category", "body", "tldr", "faqs", "sources", "coverImage", "authorName", "authorInitials", "authorType", "authorUrl", "status", "publishedAt", "createdAt", "updatedAt") VALUES (
  'blogseed03', 'guia-fotografiar-autos', 'Guía rápida para fotografiar autos del concesionario', 'Ángulos, iluminación y postproducción básica para que tus publicaciones se vean mejor con el celular que ya tenés.', 'operativa',
  '## La luz lo es casi todo

Fotografiá con luz natural difusa: temprano a la mañana o al atardecer evitás los reflejos duros del sol del mediodía sobre la chapa. Las fotos son uno de los tres puntos de [cómo aumentar las consultas a tu concesionario en 30 días](/blog/aumentar-consultas-concesionario).

Evitá el contraluz y los fondos cargados. Una pared lisa o un espacio abierto y ordenado dejan que se vea el auto y no lo que hay atrás.

## Los ángulos que no pueden faltar

Mínimo: 3/4 frontal (la foto principal), lateral, 3/4 trasero, interior desde el asiento del conductor, tablero y baúl.

Sumá detalles que generan confianza: tapizado, llantas, motor. La transparencia reduce las consultas de "¿está bien?" y atrae compradores más decididos.

## Postproducción mínima y consistente

Un encuadre parejo, recorte uniforme y un leve ajuste de brillo y contraste alcanzan. No exageres la edición: una foto demasiado retocada genera desconfianza.

Lo que más se nota es que todos tus autos sigan el mismo estilo: mismo encuadre, mismo fondo, mismo orden de fotos. Las fotos flojas son uno de [los 5 errores más comunes al cargar stock online](/blog/errores-cargar-stock-online).',
  ARRAY['Sacá las fotos con luz natural difusa (temprano a la mañana o al atardecer) y con un fondo liso.', 'Ángulos mínimos: 3/4 frontal, lateral, 3/4 trasero, interior desde el asiento del conductor, tablero y baúl.', 'Editá poco y mantené el mismo estilo en todos los autos del catálogo.']::TEXT[], '[]', '[]', '/premium_images/P9_blog_fotografia.png',
  'Mateo Lonzayes', 'ML', 'Person', NULL,
  'published', '2026-04-25 12:00:00', '2026-04-25 12:00:00', '2026-04-25 12:00:00'
);

INSERT INTO "blog_posts" ("id", "slug", "title", "excerpt", "category", "body", "tldr", "faqs", "sources", "coverImage", "authorName", "authorInitials", "authorType", "authorUrl", "status", "publishedAt", "createdAt", "updatedAt") VALUES (
  'blogseed04', 'errores-cargar-stock-online', '5 errores comunes al cargar stock online', 'Datos legales incompletos, fotos mal recortadas, precios sin moneda. Cada error te cuesta consultas. Cómo detectarlos y corregirlos.', 'stock',
  '## 1. Datos incompletos o inconsistentes

Año, kilometraje, tipo de combustible y transmisión cargados a medias hacen que el comprador desconfíe o ni siquiera te encuentre en los filtros. Completá todos los campos, siempre.

## 2. Precios sin moneda o desactualizados

Un precio sin aclarar si es en pesos o dólares genera consultas que no convierten. Y un precio viejo te hace perder credibilidad. Revisá y actualizá con frecuencia, y si dudás del número mirá [cómo calcular el precio justo de un usado](/blog/calcular-precio-justo-usado).

## 3. Fotos pocas o de mala calidad

Una sola foto, oscura o mal recortada, mata la publicación. El stock online se vende con imágenes: invertí esos minutos por vehículo siguiendo la [guía rápida para fotografiar autos del concesionario](/blog/guia-fotografiar-autos).

## 4. Descripciones vacías

Dejar la descripción en blanco o copiar la misma para todos los autos desperdicia una oportunidad de posicionar y de responder dudas antes de que las pregunten.

## 5. No despublicar lo vendido

Mantener publicado un auto ya vendido genera consultas inútiles y frustra al comprador. Marcalo como vendido el mismo día que se entrega.',
  ARRAY['Los cinco errores: datos incompletos, precio sin moneda o desactualizado, pocas fotos o de mala calidad, descripciones vacías y autos vendidos que siguen publicados.', 'Cada uno genera consultas que no convierten o hace que el comprador no te encuentre en los filtros.']::TEXT[], '[]', '[]', NULL,
  'MW Studio Digital', 'MW', 'Organization', 'https://mwstudiodigital.com',
  'published', '2026-04-18 12:00:00', '2026-04-18 12:00:00', '2026-04-18 12:00:00'
);

INSERT INTO "blog_posts" ("id", "slug", "title", "excerpt", "category", "body", "tldr", "faqs", "sources", "coverImage", "authorName", "authorInitials", "authorType", "authorUrl", "status", "publishedAt", "createdAt", "updatedAt") VALUES (
  'blogseed05', 'tendencias-2026-compradores', 'Tendencias 2026: qué esperan los compradores de autos', 'Financiación digital, transparencia de precios y experiencia mobile-first. Lo que cambió en el último año y cómo adaptarte.', 'tendencias',
  '## Todo empieza en el celular

Buena parte de la búsqueda de un auto hoy se hace desde el teléfono. Si tu sitio no carga rápido y no se ve bien en mobile, perdés al comprador antes de que vea el precio.

Por eso un catálogo online se diseña primero para el celular. Todos [los sitios que armamos con motorflow](/precios) salen así por default.

## Transparencia de precios

Al comprador le genera desconfianza el "consultar precio". Mostrar el precio claro, con la moneda y las condiciones, genera más confianza y filtra consultas serias. Para llegar a ese número con criterio, mirá [cómo calcular el precio justo de un usado](/blog/calcular-precio-justo-usado).

## Financiación clara desde el primer contacto

Si podés mostrar opciones de financiación o cotizar una operación en el momento, el comprador no tiene que esperar tu respuesta para decidir.',
  ARRAY['La búsqueda de un auto arranca en el celular: el catálogo tiene que cargar rápido y verse bien ahí.', 'Mostrar el precio con la moneda y las condiciones genera más confianza que un "consultar precio".', 'Mostrar opciones de financiación o cotizar en el momento acorta el camino a la venta.']::TEXT[], '[]', '[]', NULL,
  'Mateo Lonzayes', 'ML', 'Person', NULL,
  'published', '2026-04-10 12:00:00', '2026-04-10 12:00:00', '2026-04-10 12:00:00'
);

INSERT INTO "blog_posts" ("id", "slug", "title", "excerpt", "category", "body", "tldr", "faqs", "sources", "coverImage", "authorName", "authorInitials", "authorType", "authorUrl", "status", "publishedAt", "createdAt", "updatedAt") VALUES (
  'blogseed06', 'calcular-precio-justo-usado', 'Cómo calcular el precio justo de un usado', 'Fuentes de mercado, factores que ajustan el valor (estado, kilometraje, demanda regional) y un método práctico para evitar tasaciones erradas.', 'operativa',
  '## Partí del valor de mercado

Cruzá varias fuentes: guías de precios, publicaciones activas del mismo modelo/año/versión y operaciones reales recientes. El precio que publica la competencia sirve como una referencia más.

## Ajustá por los factores que importan

Estado general, kilometraje, historial de service, originalidad y demanda regional mueven el valor para arriba o para abajo. Un mismo modelo no vale lo mismo en dos ciudades distintas.

## Un método simple y repetible

Tomá el valor de mercado base, aplicá los ajustes por estado y kilometraje, y contrastá contra tu margen objetivo. Documentá el criterio: así tasás parejo y no a ojo.

Una vez definido el precio, cargalo bien: publicarlo sin moneda o desactualizado es uno de [los 5 errores más comunes al cargar stock online](/blog/errores-cargar-stock-online).',
  ARRAY['Partí del valor de mercado: cruzá guías de precios, publicaciones activas del mismo modelo, año y versión, y operaciones recientes.', 'Ajustá por estado general, kilometraje, historial de service, originalidad y demanda regional.', 'Contrastá el resultado contra tu margen objetivo y documentá el criterio para tasar siempre igual.']::TEXT[], '[]', '[]', NULL,
  'MW Studio Digital', 'MW', 'Organization', 'https://mwstudiodigital.com',
  'published', '2026-04-03 12:00:00', '2026-04-03 12:00:00', '2026-04-03 12:00:00'
);
