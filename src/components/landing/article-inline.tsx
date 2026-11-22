import Link from "next/link";

// [anchor](/ruta) interno, [anchor](https://...) externo, o **negrita**.
// Solo esas dos formas de URL: un `javascript:` o un `data:` no matchean y
// quedan como texto. El cuerpo viene del admin, pero el filtro no se negocia.
const INLINE = /\[([^\]]+)\]\((\/[^)\s]*|https:\/\/[^)\s]+)\)|\*\*([^*]+)\*\*/g;

const LINK_CLASS =
  "font-normal text-blue-600 underline decoration-blue-200 underline-offset-2 transition hover:decoration-blue-500";

/**
 * Texto de una nota con sus marcas inline resueltas. Los links internos van con
 * <Link> (navegación del App Router); los externos abren en otra pestaña y sin
 * pasar referrer de más.
 */
export function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE)) {
    const [full, anchor, href, bold] = match;
    const start = match.index;
    if (start > lastIndex) nodes.push(text.slice(lastIndex, start));

    if (bold) {
      nodes.push(<strong key={start} className="font-medium text-gray-800">{bold}</strong>);
    } else if (href.startsWith("/")) {
      nodes.push(<Link key={start} href={href} className={LINK_CLASS}>{anchor}</Link>);
    } else {
      nodes.push(
        <a key={start} href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          {anchor}
        </a>
      );
    }

    lastIndex = start + full.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}
