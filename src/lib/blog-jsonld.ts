import { SITE_URL, SITE_NAME } from "@/lib/seo";
import { categoryLabel, type BlogPost } from "@/data/post-types";
import { getPostCoverUrl, getPostUpdatedAt, getPostUrl, getPostWordCount, stripLinks } from "@/lib/blog";

/**
 * JSON-LD de una nota: un solo `@graph` con BlogPosting + BreadcrumbList (+
 * FAQPage si la nota trae preguntas). Un script con @graph en vez de varios
 * sueltos: los nodos quedan vinculados como una misma página.
 */
export function buildPostJsonLd(post: BlogPost) {
  const postUrl = getPostUrl(post);
  const coverUrl = getPostCoverUrl(post);

  // BreadcrumbList: Google muestra "motorflowapp.com › Blog › Título" en vez de
  // la URL cruda. Las migas tienen que coincidir con la navegación real.
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
    dateModified: getPostUpdatedAt(post),
    articleSection: categoryLabel(post.category),
    inLanguage: "es-AR",
    wordCount: getPostWordCount(post),
    author: {
      "@type": post.authorType ?? "Person",
      name: post.authorName,
      ...(post.authorUrl ? { url: post.authorUrl } : {}),
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo/motorflow_light.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
    ...(coverUrl ? { image: coverUrl } : {}),
    ...(post.sources?.length ? { citation: post.sources.map((s) => s.url) } : {}),
  };

  const faqLd = post.faqs?.length
    ? {
        "@type": "FAQPage",
        mainEntity: post.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: stripLinks(f.answer) },
        })),
      }
    : null;

  return {
    "@context": "https://schema.org",
    "@graph": [articleLd, breadcrumbLd, ...(faqLd ? [faqLd] : [])],
  };
}
