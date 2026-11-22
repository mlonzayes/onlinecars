/**
 * Markdown SIMPLE para el cuerpo de las notas del blog. Se parsea acá y no con
 * una librería: el subconjunto es chico, y así controlamos qué HTML puede salir
 * (nada de HTML crudo, ni imágenes, ni scripts).
 *
 * Soporta:
 *   ## Subtítulo          → h2      ### Subtítulo → h3
 *   - item / * item        → lista   1. item       → lista numerada
 *   línea en blanco        → separa párrafos (líneas seguidas se unen)
 *   [texto](/ruta) o [texto](https://...) y **negrita** → dentro del texto
 */

export type MarkdownBlock =
  | { type: "h2" | "h3" | "p"; text: string }
  | { type: "ul" | "ol"; items: string[] };

const HEADING = /^(#{2,3})\s+(.+)$/;
const UNORDERED = /^[-*]\s+(.+)$/;
const ORDERED = /^\d+[.)]\s+(.+)$/;

export function parseMarkdown(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) blocks.push({ type: "p", text: paragraph.join(" ") });
    paragraph = [];
  };

  const pushItem = (type: "ul" | "ol", item: string) => {
    flushParagraph();
    const last = blocks.at(-1);
    if (last && last.type === type) last.items.push(item);
    else blocks.push({ type, items: [item] });
  };

  for (const rawLine of source.replace(/\r\n/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flushParagraph();
      blocks.push({ type: heading[1].length === 2 ? "h2" : "h3", text: heading[2].trim() });
      continue;
    }

    const ul = UNORDERED.exec(line);
    if (ul) {
      pushItem("ul", ul[1]);
      continue;
    }

    const ol = ORDERED.exec(line);
    if (ol) {
      pushItem("ol", ol[1]);
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return blocks;
}

/** `[texto](url)` → `texto` y `**x**` → `x`. Para conteos y JSON-LD. */
export function stripInlineMarkdown(text: string): string {
  return text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1");
}

/** Texto plano del cuerpo, en orden de lectura (sin marcas de Markdown). */
export function markdownToPlainText(source: string): string {
  return parseMarkdown(source)
    .flatMap((b) => ("items" in b ? b.items : [b.text]))
    .map(stripInlineMarkdown)
    .join("\n");
}
