import { SITE_URL } from "@/lib/seo";
import { categoryLabel, type BlogPost } from "@/data/post-types";
import { markdownToPlainText, stripInlineMarkdown } from "@/lib/blog-markdown";

// Velocidad de lectura promedio en español para texto informativo.
const WORDS_PER_MINUTE = 200;

// [anchor](/ruta interna): fuera del sitio hay que volverla absoluta.
const INTERNAL_LINK = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;

/** Todo el texto legible de la nota, en el orden en que se lee. */
function postTextBlocks(post: BlogPost): string[] {
  return [
    post.excerpt,
    ...(post.tldr ?? []),
    markdownToPlainText(post.body),
    ...(post.faqs ?? []).flatMap((f) => [f.question, f.answer]),
  ];
}

/** `[anchor](url)` → `anchor` y sin negritas. Para JSON-LD y conteos, donde el link no va. */
export function stripLinks(text: string): string {
  return stripInlineMarkdown(text);
}

export function getPostWordCount(post: BlogPost): number {
  return postTextBlocks(post)
    .map(stripLinks)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * Minutos de lectura calculados desde el texto. Antes se cargaban a mano y
 * decían "8 min" en notas que se leen en uno: un dato inflado le resta
 * credibilidad a la nota justo cuando alguien decide si leerla.
 */
export function getReadingMinutes(post: BlogPost): number {
  return Math.max(1, Math.round(getPostWordCount(post) / WORDS_PER_MINUTE));
}

export function getPostUpdatedAt(post: BlogPost): string {
  return post.updatedAt ?? post.publishedAt;
}

/** URL absoluta de la portada (las subidas al bucket ya lo son; las de /public no). */
export function getPostCoverUrl(post: BlogPost): string | null {
  if (!post.coverImage) return null;
  return post.coverImage.startsWith("/") ? `${SITE_URL}${post.coverImage}` : post.coverImage;
}

export function getPostUrl(post: BlogPost): string {
  return `${SITE_URL}/blog/${post.slug}`;
}

/** Links internos → absolutos: fuera del sitio, una ruta relativa no lleva a ningún lado. */
function absolutizeLinks(text: string): string {
  return text.replace(INTERNAL_LINK, (_, anchor: string, href: string) => `[${anchor}](${SITE_URL}${href})`);
}

/**
 * La nota entera en Markdown, para `llms-full.txt`. Los modelos leen mejor
 * texto plano con estructura que HTML con navbar, footer y scripts.
 */
export function postToMarkdown(post: BlogPost): string {
  const lines: string[] = [
    `## ${post.title}`,
    "",
    `URL: ${getPostUrl(post)}`,
    `Categoría: ${categoryLabel(post.category)} · Autor: ${post.authorName} · Publicado: ${post.publishedAt} · Actualizado: ${getPostUpdatedAt(post)}`,
    "",
    absolutizeLinks(post.excerpt),
  ];

  if (post.tldr?.length) {
    lines.push("", "**En resumen**", ...post.tldr.map((t) => `- ${absolutizeLinks(t)}`));
  }

  // El título de la nota es ##: los subtítulos del cuerpo bajan un nivel.
  const body = post.body.replace(/^(#{2,3})\s/gm, (_, hashes: string) => `${hashes}# `);
  lines.push("", absolutizeLinks(body));

  if (post.faqs?.length) {
    lines.push("", "### Preguntas frecuentes");
    for (const f of post.faqs) lines.push("", `**${f.question}**`, absolutizeLinks(f.answer));
  }

  if (post.sources?.length) {
    lines.push("", "### Fuentes", ...post.sources.map((s) => `- [${s.label}](${s.url})`));
  }

  return lines.join("\n");
}
