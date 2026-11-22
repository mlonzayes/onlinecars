import { renderInline } from "./article-inline";

interface ArticleParagraphProps {
  /** Texto del párrafo. Admite `[texto](/ruta)`, `[texto](https://...)` y `**negrita**`. */
  text: string;
  className?: string;
}

/**
 * Párrafo de artículo con links y negrita.
 *
 * El link contextual (anchor descriptivo DENTRO de la prosa) es lo que arma los
 * topic clusters: reparte autoridad entre las notas y empuja al lector hacia las
 * páginas comerciales. Un bloque de "notas relacionadas" al pie no lo reemplaza.
 */
export function ArticleParagraph({ text, className }: ArticleParagraphProps) {
  return <p className={className}>{renderInline(text)}</p>;
}
