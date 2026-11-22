import type { PostSource } from "@/data/post-types";

interface PostSourcesProps {
  sources: PostSource[];
}

/**
 * Fuentes de una nota. Una cifra con su fuente al lado es lo que hace que un
 * motor de IA prefiera citar esta nota y no otra. Links externos con
 * `noopener` y sin pasar referrer de más.
 */
export function PostSources({ sources }: PostSourcesProps) {
  if (sources.length === 0) return null;

  return (
    <section className="mt-12 border-t border-gray-200 pt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Fuentes</h2>
      <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
        {sources.map((s) => (
          <li key={s.url}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline decoration-blue-200 underline-offset-2 hover:decoration-blue-500"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
