import Link from "next/link";

interface ArticleParagraphProps {
  /** Texto del párrafo. Admite links internos con sintaxis `[texto](/ruta)`. */
  text: string;
  className?: string;
}

// Captura [anchor](/ruta). La ruta DEBE empezar con "/" — el contenido de los
// posts es nuestro, pero limitar a rutas internas evita que un `javascript:` o
// un dominio externo entre por acá si algún día el body viene de un CMS.
const INTERNAL_LINK = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;

/**
 * Párrafo de artículo con soporte de enlaces internos.
 *
 * El interlinkeado contextual (anchor descriptivo DENTRO de la prosa) es lo que
 * arma los topic clusters: reparte autoridad entre las notas y empuja al lector
 * hacia las páginas comerciales. Un bloque de "notas relacionadas" al pie ayuda,
 * pero no reemplaza al link en el medio del texto, que es el que se lee en
 * contexto y el que Google pondera.
 *
 * Se resuelve con un split por regex y no con un parser de Markdown: es una sola
 * construcción, y sumar una dependencia de Markdown para esto sería traer un
 * camión para llevar una caja.
 */
export function ArticleParagraph({ text, className }: ArticleParagraphProps) {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;

  // matchAll sobre una regex con /g: reseteamos lastIndex implícitamente al
  // crear el iterador, así el componente es seguro de renderizar N veces.
  for (const match of text.matchAll(INTERNAL_LINK)) {
    const [full, anchor, href] = match;
    const start = match.index;

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    nodes.push(
      <Link
        key={`${href}-${start}`}
        href={href}
        className="font-normal text-blue-600 underline decoration-blue-200 underline-offset-2 transition hover:decoration-blue-500"
      >
        {anchor}
      </Link>
    );

    lastIndex = start + full.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <p className={className}>{nodes}</p>;
}
