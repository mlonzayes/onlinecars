import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { JsonLd } from "@/components/seo/json-ld";
import { ArticleBlocks } from "@/components/landing/article-blocks";
import { PostSummary } from "@/components/landing/post-summary";
import { PostFaqs } from "@/components/landing/post-faqs";
import { PostSources } from "@/components/landing/post-sources";
import { PostCta } from "@/components/landing/post-cta";
import { categoryLabel } from "@/data/post-types";
import { getAllPosts, getPostBySlug } from "@/lib/blog-posts";
import { getPostUpdatedAt, getPostUrl, getReadingMinutes } from "@/lib/blog";
import { buildPostJsonLd } from "@/lib/blog-jsonld";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(iso: string): string {
  return DATE_FORMATTER.format(new Date(`${iso}T00:00:00`));
}

// Pre-renderiza en build las notas publicadas. Las que se publican después
// desde el admin se generan en el primer pedido (dynamicParams) y quedan en ISR.
export async function generateStaticParams() {
  return (await getAllPosts()).map((p) => ({ slug: p.slug }));
}

// Una nota programada aparece con la regeneración (como mucho 1 h).
export const revalidate = 3600;

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Nota no encontrada" };

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url: getPostUrl(post),
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
      modifiedTime: getPostUpdatedAt(post),
      authors: [post.authorName],
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const updatedAt = getPostUpdatedAt(post);
  const wasUpdated = updatedAt !== post.publishedAt;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <JsonLd data={buildPostJsonLd(post)} />
      <Navbar />

      <main className="flex-1 px-4 pb-16 pt-28">
        <article className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al blog
          </Link>

          <header className="mt-6">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
              {categoryLabel(post.category)}
            </span>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-4xl">
              {post.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
              {post.authorUrl ? (
                <a href={post.authorUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-700 hover:underline">
                  {post.authorName}
                </a>
              ) : (
                <span className="font-medium text-gray-700">{post.authorName}</span>
              )}
              <span className="text-gray-300">·</span>
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              {wasUpdated && (
                <>
                  <span className="text-gray-300">·</span>
                  <span>
                    Actualizado el <time dateTime={updatedAt}>{formatDate(updatedAt)}</time>
                  </span>
                </>
              )}
              <span className="text-gray-300">·</span>
              <span>{getReadingMinutes(post)} min de lectura</span>
            </div>
          </header>

          {post.coverImage && (
            <div className="relative mt-8 aspect-video overflow-hidden rounded-2xl">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                priority
              />
            </div>
          )}

          <p className="mt-8 text-lg font-light leading-relaxed text-gray-600">{post.excerpt}</p>

          <PostSummary items={post.tldr ?? []} />

          <div className="mt-8">
            {/* Primer CTA después del primer bloque, no solo al final */}
            <ArticleBlocks markdown={post.body} afterFirstSection={<PostCta variant="inline" />} />
          </div>

          <PostFaqs faqs={post.faqs ?? []} />
          <PostSources sources={post.sources ?? []} />
          <PostCta variant="box" />
        </article>
      </main>

      <Footer />
    </div>
  );
}
