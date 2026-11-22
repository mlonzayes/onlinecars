import type { PostFaq } from "@/data/post-types";
import { ArticleParagraph } from "./article-paragraph";

interface PostFaqsProps {
  faqs: PostFaq[];
}

/**
 * Preguntas frecuentes de una nota. Se renderizan abiertas (no en <details>):
 * la respuesta tiene que estar a la vista para el lector y para los motores
 * que la citan. El mismo contenido va al JSON-LD FAQPage (lib/blog-jsonld.ts).
 */
export function PostFaqs({ faqs }: PostFaqsProps) {
  if (faqs.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold text-gray-900">Preguntas frecuentes</h2>
      <dl className="mt-4 space-y-5">
        {faqs.map((f) => (
          <div key={f.question}>
            <dt className="text-base font-medium text-gray-900">{f.question}</dt>
            <dd>
              <ArticleParagraph text={f.answer} className="mt-1 text-base font-light leading-relaxed text-gray-600" />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
