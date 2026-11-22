import { Fragment } from "react";
import { parseMarkdown, type MarkdownBlock } from "@/lib/blog-markdown";
import { renderInline } from "./article-inline";

interface ArticleBlocksProps {
  /** Cuerpo de la nota en Markdown simple. */
  markdown: string;
  /**
   * Se inserta antes del SEGUNDO subtítulo (después del primer bloque de
   * contenido). Sirve para el CTA de mitad de nota. Si la nota tiene un solo
   * subtítulo, no se muestra.
   */
  afterFirstSection?: React.ReactNode;
}

const TEXT = "text-base font-light leading-relaxed text-gray-600";

function Block({ block }: { block: MarkdownBlock }) {
  switch (block.type) {
    case "h2":
      return <h2 className="pt-4 text-xl font-semibold text-gray-900">{renderInline(block.text)}</h2>;
    case "h3":
      return <h3 className="pt-2 text-lg font-semibold text-gray-900">{renderInline(block.text)}</h3>;
    case "p":
      return <p className={TEXT}>{renderInline(block.text)}</p>;
    case "ul":
    case "ol": {
      const List = block.type;
      return (
        <List className={`${TEXT} ${block.type === "ul" ? "list-disc" : "list-decimal"} space-y-1.5 pl-6`}>
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </List>
      );
    }
  }
}

/**
 * Cuerpo de una nota. Lo usan la página pública y la vista previa del editor
 * del admin, así lo que se previsualiza es exactamente lo que se publica.
 */
export function ArticleBlocks({ markdown, afterFirstSection }: ArticleBlocksProps) {
  const blocks = parseMarkdown(markdown);
  const h2Indexes = blocks.flatMap((b, i) => (b.type === "h2" ? [i] : []));
  const insertAt = afterFirstSection && h2Indexes.length > 1 ? h2Indexes[1] : -1;

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => (
        <Fragment key={i}>
          {i === insertAt && afterFirstSection}
          <Block block={block} />
        </Fragment>
      ))}
    </div>
  );
}
