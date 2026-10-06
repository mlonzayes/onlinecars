// Colores derivados del color de marca que elige el dealer. Funciones puras:
// las usa <TenantChrome> para armar las CSS vars del sitio del tenant.

const MIN_TEXT_CONTRAST = 4.5; // WCAG AA para texto normal

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Variante del color de marca para usar como TEXTO sobre los fondos de la
 * plantilla. El dealer elige su color libremente (ej: un violeta oscuro sobre
 * una plantilla negra daba 2,4:1, ilegible y marcado por Lighthouse). Se mezcla
 * hacia blanco (plantilla oscura) o negro (clara) lo justo para llegar a 4,5:1
 * contra TODOS los fondos dados. Si ya cumple, se devuelve tal cual.
 */
export function accessibleTextColor(
  color: string,
  backgrounds: string[],
  tone: "light" | "dark"
): string {
  const base = parseHex(color);
  const bgs = backgrounds.map(parseHex).filter((b): b is [number, number, number] => b !== null);
  if (!base || bgs.length === 0) return color;

  const target: [number, number, number] = tone === "dark" ? [255, 255, 255] : [0, 0, 0];
  const passes = (c: [number, number, number]) =>
    bgs.every((bg) => contrast(c, bg) >= MIN_TEXT_CONTRAST);

  for (let step = 0; step <= 20; step++) {
    const t = step / 20;
    const mixed = base.map((c, i) => Math.round(c + (target[i] - c) * t)) as [number, number, number];
    if (passes(mixed)) return toHex(mixed);
  }
  return toHex(target);
}
