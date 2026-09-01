import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { JsonLd } from "@/components/seo/json-ld";
import { ArticleParagraph } from "@/components/landing/article-paragraph";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import { getPostBySlug, getAllPosts, categoryLabel } from "@/data/posts";

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

// Pre-renderiza todas las notas en build (SSG) — rápido y bueno para SEO.
export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Nota no encontrada" };

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url: `${SITE_URL}/blog/${post.slug}`,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
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
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const postUrl = `${SITE_URL}/blog/${post.slug}`;

  // BreadcrumbList: hace que Google muestre "motorflowapp.com › Blog › Título"
  // en vez de la URL cruda. Es de lo que más rinde por lo poco que cuesta, y
  // las migas tienen que coincidir con la navegación real de la página.
  const breadcrumbLd = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
    ],
  };

  const articleLd = {
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    articleSection: categoryLabel(post.category),
    inLanguage: "es-AR",
    author: { "@type": "Person", name: post.authorName },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo/motorflow_light.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    ...(post.coverImage ? { image: `${SITE_URL}${post.coverImage}` } : {}),
  };

  // Un solo <script> con @graph en vez de dos sueltos: los nodos quedan
  // vinculados como una misma página y no compiten entre sí.
  const pageLd = {
    "@context": "https://schema.org",
    "@graph": [articleLd, breadcrumbLd],
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <JsonLd data={pageLd} />
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
              <span className="font-medium text-gray-700">{post.authorName}</span>
              <span className="text-gray-300">·</span>
              <span>{formatDate(post.publishedAt)}</span>
              <span className="text-gray-300">·</span>
              <span>{post.readingMinutes} min de lectura</span>
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

          <p className="mt-8 text-lg font-light leading-relaxed text-gray-600">
            {post.excerpt}
          </p>

          <div className="mt-8 space-y-8">
            {post.content.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl font-semibold text-gray-900">{section.heading}</h2>
                {section.body.map((paragraph, i) => (
                  <ArticleParagraph
                    key={i}
                    text={paragraph}
                    className="mt-3 text-base font-light leading-relaxed text-gray-600"
                  />
                ))}
              </section>
            ))}
          </div>

          {/* CTA al final del artículo */}
          <div className="mt-12 rounded-2xl border border-blue-100 bg-blue-50 p-6 text-center sm:p-8">
            <h3 className="text-lg font-semibold text-gray-900">
              ¿Listo para llevar tu concesionario online?
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm font-light text-gray-600">
              Creá tu sitio profesional con catálogo, stock y captación de leads. Sin comisiones.
            </p>
            <Link
              href="/#planes"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Ver planes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
