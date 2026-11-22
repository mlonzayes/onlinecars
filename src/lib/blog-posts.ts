import "server-only";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { z } from "zod";
import type { BlogPost as BlogPostRow } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  POST_AUTHOR_TYPES,
  POST_CATEGORIES,
  type BlogPost,
  type PostAuthorType,
  type PostCategory,
} from "@/data/post-types";

/**
 * Lectura de las notas del blog para la web pública (blog, sitemap, llms).
 *
 * Cache: `unstable_cache` con tag `blog-posts`, invalidado desde el admin con
 * invalidateBlogPosts(). Guarda TODAS las publicadas, incluidas las programadas;
 * el filtro por fecha se hace afuera, en cada render. Así una nota programada
 * aparece con la próxima regeneración de la página (ISR de 1 hora), sin que
 * nadie tenga que tocar nada.
 */

const AR_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
});

/** Date → "YYYY-MM-DD" en hora argentina (la fecha que ve el lector). */
export function toArDate(date: Date): string {
  return AR_DATE.format(date);
}

const faqsSchema = z.array(z.object({ question: z.string(), answer: z.string() }));
const sourcesSchema = z.array(z.object({ label: z.string(), url: z.string() }));

function isCategory(value: string): value is PostCategory {
  return (POST_CATEGORIES as readonly string[]).includes(value);
}

function isAuthorType(value: string): value is PostAuthorType {
  return (POST_AUTHOR_TYPES as readonly string[]).includes(value);
}

/** Fila de la DB → BlogPost. Los Json se validan: la DB no garantiza la forma. */
export function toBlogPost(row: BlogPostRow): BlogPost {
  const faqs = faqsSchema.safeParse(row.faqs);
  const sources = sourcesSchema.safeParse(row.sources);

  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: isCategory(row.category) ? row.category : "operativa",
    publishedAt: toArDate(row.publishedAt ?? row.createdAt),
    ...(row.contentUpdatedAt ? { updatedAt: toArDate(row.contentUpdatedAt) } : {}),
    authorName: row.authorName,
    authorInitials: row.authorInitials,
    authorType: isAuthorType(row.authorType) ? row.authorType : "Person",
    ...(row.authorUrl ? { authorUrl: row.authorUrl } : {}),
    ...(row.coverImage ? { coverImage: row.coverImage } : {}),
    tldr: row.tldr,
    body: row.body,
    faqs: faqs.success ? faqs.data : [],
    sources: sources.success ? sources.data : [],
  };
}

interface CachedPost {
  post: BlogPost;
  /** Momento de salida en ms. unstable_cache serializa a JSON: nada de Date acá. */
  releaseAt: number;
}

const getPublishedPosts = unstable_cache(
  async (): Promise<CachedPost[]> => {
    const rows = await prisma.blogPost.findMany({
      where: { status: "published", publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
    });
    return rows.map((row) => ({
      post: toBlogPost(row),
      releaseAt: (row.publishedAt ?? row.createdAt).getTime(),
    }));
  },
  ["blog-posts"],
  { tags: [CACHE_TAGS.blogPosts], revalidate: 3600 }
);

/** Notas ya publicadas (sin las programadas), de la más nueva a la más vieja. */
export async function getAllPosts(): Promise<BlogPost[]> {
  const now = Date.now();
  return (await getPublishedPosts()).filter((p) => p.releaseAt <= now).map((p) => p.post);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  return (await getAllPosts()).find((p) => p.slug === slug);
}

/**
 * Después de crear, editar o borrar una nota. Invalida los datos cacheados y el
 * HTML regenerado del blog y del sitemap. llms.txt y llms-full.txt son route
 * handlers dinámicos: leen de la cache de datos, así que con el tag alcanza.
 */
export function invalidateBlogPosts(): void {
  revalidateTag(CACHE_TAGS.blogPosts);
  revalidatePath("/blog", "layout");
  revalidatePath("/sitemap.xml");
}
