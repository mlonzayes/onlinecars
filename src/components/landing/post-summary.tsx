import { ArticleParagraph } from "./article-paragraph";

interface PostSummaryProps {
  items: string[];
}

/**
 * "En resumen" de una nota del blog. Va arriba, apenas después de la bajada:
 * es la respuesta corta que busca quien llega desde Google o desde un chat de
 * IA, y el bloque que esos motores citan. Cada ítem tiene que entenderse solo.
 */
export function PostSummary({ items }: PostSummaryProps) {
  if (items.length === 0) return null;

  return (
    <aside aria-labelledby="post-summary" className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:p-6">
      <h2 id="post-summary" className="text-sm font-semibold uppercase tracking-wide text-gray-900">
        En resumen
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-blue-600">
        {items.map((item) => (
          <li key={item}>
            <ArticleParagraph text={item} className="text-base font-light leading-relaxed text-gray-700" />
          </li>
        ))}
      </ul>
    </aside>
  );
}
