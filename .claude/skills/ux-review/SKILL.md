---
name: ux-review
description: >-
  Revisión de UX de una pantalla, form o flujo de motorflow con las 10
  heurísticas de usabilidad de Nielsen y una auditoría de carga cognitiva
  orientada a conversión. Úsala cuando se pida revisar un flujo o un form, se
  pregunte "por qué no convierte", "dónde se traba la gente", "¿esto es buena
  UX?", "simplificá este form", o antes de tocar los puntos de conversión: form
  de contacto de la landing, form de consulta y cotizador del sitio del tenant,
  onboarding y alta de vehículo en el panel. Revisa comportamiento y
  comprensión, no estética (para eso, redesign-audit).
---

# UX review — motorflow

No es una revisión visual. Pregunta: ¿la persona entiende qué hacer, puede
hacerlo sin pensar de más y sabe qué pasó después?

## Quién usa cada superficie

Tener en mente al usuario real antes de opinar:

- **Marketing** — dueño o encargado de una agencia chica/mediana. Poco tiempo,
  desconfiado de "otra plataforma más", compara contra MercadoLibre. Entra
  mayormente desde el celular, a menudo desde un anuncio de Meta.
- **Sitio del tenant** — alguien buscando un auto. Celular casi siempre,
  quiere precio, fotos, km y un WhatsApp. La conversión es el lead.
- **Panel** — el dealer y sus vendedores, todos los días, muchas veces desde
  el celular en el playón. Velocidad y no equivocarse > descubrir features.

## Modo 1 — Heurísticas (pantalla o flujo)

Recorrer solo las que aplican; saltear las que claramente están bien.

1. **Estado del sistema visible** — ¿se nota que algo está cargando, se guardó
   o falló? (toasts de Sonner, `Skeleton`, botón deshabilitado con spinner).
2. **Lenguaje del usuario** — "Publicar en tu sitio", no "toggle publishedAt".
   Vocabulario del rubro: patente, 0km, usado, seña, boleto, F08.
3. **Control y salida** — cancelar, volver, deshacer. Ningún paso sin salida.
4. **Consistencia** — mismo componente = mismo comportamiento en todo el panel.
   Los patrones del `CLAUDE.md` existen para esto.
5. **Prevención de errores** — defaults sensatos, máscaras de formato,
   `ConfirmDialog` en lo destructivo, bloqueo de ediciones con venta activa.
6. **Reconocer antes que recordar** — mostrar lo ya cargado; no pedir que la
   persona se acuerde de un dato de otra pantalla.
7. **Flexibilidad** — atajos para el uso diario (bulk actions, filtros en la
   URL, WhatsApp/tel con un toque).
8. **Diseño minimalista** — cada elemento compite por atención; lo que no
   ayuda a decidir, sobra.
9. **Errores que ayudan** — qué pasó y cómo resolverlo, inline y en español
   llano. Nunca "Error 400" ni "Datos inválidos" a secas.
10. **Ayuda en contexto** — una línea de ayuda debajo del campo difícil vale
    más que una página de documentación.

## Modo 2 — Carga cognitiva (forms y puntos de conversión)

Separar la carga **intrínseca** (lo que la tarea exige sí o sí) de la
**extra** (todo lo demás). Solo la extra es nuestro problema. Tres palancas:

**Sacar ruido.** Por cada elemento: ¿ayuda a entender qué hacer o por qué?
Si se va, ¿se pierde algo? Señales típicas: varios CTAs con el mismo peso en
el mismo punto de decisión, links que compiten con el submit, texto legal
antes de que haga falta, decoración que no dice nada del producto.

**Usar lo que ya conocen.** Botón primario = el más visible; destructivo =
menos prominente; label arriba del campo; errores en rojo junto al campo;
señales de confianza (reseñas, datos de contacto, ubicación) cerca del submit.
Innovar en el producto, no en los controles.

**Hacer el trabajo por ellos.** Prellenar el vehículo consultado; inferir lo
que se pueda (provincia por ciudad, código de país en WhatsApp); recomendar
una opción en vez de presentar varias iguales; hacer las cuentas (precio en
ARS con la cotización del dealer, cuotas); repetir lo cargado en la
confirmación.

Para cada form, contar: **campos obligatorios, decisiones y pantallas**.
Cualquiera que no sea imprescindible para el siguiente paso se va, se vuelve
opcional o se pide después.

## Formato de salida

Empezar con un veredicto de una línea:

> Bien encaminado · Varios puntos a corregir · Problemas serios de UX

Después, solo lo relevante, agrupado por heurística o palanca:

```
**H5 · Prevención de errores**
- `<archivo>:<línea>` — el teléfono acepta cualquier texto; el lead llega sin
  forma de contactarlo. Validar con Zod y mostrar el formato esperado como
  placeholder.
```

Cerrar con **Prioridades** — máximo 3, ordenadas por impacto en conversión o
en errores evitados.

Sin párrafos largos. Cada hallazgo con `archivo:línea` cuando se revisa código.

## Reglas al aplicar los cambios

- No tocar el honeypot (`website`), el `metaEventId` ni los eventos de
  Clarity de los forms de contacto/lead: son tracking y anti-spam, no ruido.
- Validación: el mismo schema Zod de `src/lib/validators/` en cliente y server.
- Sin "(opcional)" en labels; asterisco en los obligatorios.
- Si la mejora toca diseño visual, seguir con
  [redesign-audit](../redesign-audit/SKILL.md).
