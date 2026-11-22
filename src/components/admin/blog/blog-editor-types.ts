import type { BlogPostFormValues } from "@/lib/validators/blog-post";

/** Props comunes de cada bloque del editor: leen los valores y mandan un parche. */
export interface BlogFieldProps {
  values: BlogPostFormValues;
  onChange: (patch: Partial<BlogPostFormValues>) => void;
}

export interface BlogAuthorDefaults {
  authorName: string;
  authorInitials: string;
  authorType: BlogPostFormValues["authorType"];
  authorUrl: string | null;
}

export function emptyBlogPost(author: BlogAuthorDefaults): BlogPostFormValues {
  return {
    title: "",
    slug: "",
    excerpt: "",
    category: "operativa",
    body: "",
    tldr: [],
    faqs: [],
    sources: [],
    coverImage: null,
    ...author,
    status: "draft",
    publishAt: null,
    contentUpdatedOn: null,
  };
}
