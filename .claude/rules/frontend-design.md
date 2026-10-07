# Frontend Design Rules

Las reglas de diseño viven ahora en skills — este archivo solo apunta a ellas
para no tener dos fuentes de verdad:

| Skill | Cuándo |
|---|---|
| [frontend-design](../skills/frontend-design/SKILL.md) | UI nueva o rediseño grande: plan de diseño antes de codear, por superficie (marketing / tenant / panel) |
| [redesign-audit](../skills/redesign-audit/SKILL.md) | Pulir algo que ya existe sin reescribirlo |
| [ux-review](../skills/ux-review/SKILL.md) | Forms, flujos y puntos de conversión |

Mínimos que valen siempre, aunque no se cargue ningún skill:

- NUNCA Inter, Arial ni Roboto como fuente principal.
- Colores y tipografías como CSS variables / tokens. En el sitio del tenant,
  SOLO `var(--tenant-*)`.
- Plan de diseño (paleta, tipo, layout, dónde se gasta la audacia) antes de
  escribir código.
- Un momento de animación orquestado > efectos sueltos en cada sección. El
  elemento LCP no se anima.
